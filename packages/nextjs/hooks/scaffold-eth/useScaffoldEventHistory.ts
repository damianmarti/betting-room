import { useEffect, useMemo, useState } from "react";
import { Abi, AbiEvent, ExtractAbiEventNames } from "abitype";
import { useInterval } from "usehooks-ts";
import { Hash } from "viem";
import * as chains from "viem/chains";
import { usePublicClient } from "wagmi";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";
import { getTargetNetwork } from "~~/utils/scaffold-eth";
import { replacer } from "~~/utils/scaffold-eth/common";
import {
  ContractAbi,
  ContractName,
  IndexedEventInputs,
  UseScaffoldEventHistoryConfig,
  UseScaffoldEventHistoryData,
} from "~~/utils/scaffold-eth/contract";

/**
 * @dev reads events from a deployed contract
 * @param config - The config settings
 * @param config.contractName - deployed contract name
 * @param config.eventName - name of the event to listen for
 * @param config.fromBlock - the block number to start reading events from
 * @param config.filters - filters to be applied to the event (parameterName: value)
 * @param config.blockData - if set to true it will return the block data for each event (default: false)
 * @param config.transactionData - if set to true it will return the transaction data for each event (default: false)
 * @param config.receiptData - if set to true it will return the receipt data for each event (default: false)
 * @param config.watch - if set to true, the events will be updated every pollingInterval milliseconds set at scaffoldConfig (default: false)
 * @param config.requiredFilters - required filters, if a required filter is not set, no events are returned and the error is returned (default: [])
 */
export const useScaffoldEventHistory = <
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
  TBlockData extends boolean = false,
  TTransactionData extends boolean = false,
  TReceiptData extends boolean = false,
  TRequiredFilters extends IndexedEventInputs<TContractName, TEventName>["name"][] = [],
>({
  contractName,
  eventName,
  fromBlock,
  filters,
  blockData,
  transactionData,
  receiptData,
  watch,
  requiredFilters,
}: UseScaffoldEventHistoryConfig<
  TContractName,
  TEventName,
  TBlockData,
  TTransactionData,
  TReceiptData,
  TRequiredFilters
>) => {
  const [events, setEvents] = useState<any[]>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [fromBlockUpdated, setFromBlockUpdated] = useState<bigint>(fromBlock);
  const { data: deployedContractData, isLoading: deployedContractLoading } = useDeployedContractInfo(contractName);
  const publicClient = usePublicClient();
  const configuredNetwork = getTargetNetwork();

  const readEvents = async ({ append }: { append?: boolean }) => {
    try {
      if (!deployedContractData) {
        throw new Error("Contract not found");
      }

      const event = (deployedContractData.abi as Abi).find(
        part => part.type === "event" && part.name === eventName,
      ) as AbiEvent;

      if (requiredFilters && requiredFilters.length > 0) {
        const missingFields = requiredFilters.filter(field => !filters || !filters[field]);
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
        }
      }

      const blockNumber = await publicClient.getBlockNumber({ cacheTime: 0 });
      if (blockNumber >= fromBlockUpdated) {
        const logs = await publicClient.getLogs({
          address: deployedContractData?.address,
          event,
          args: filters as any, // TODO: check if it works and fix type
          fromBlock: fromBlockUpdated,
          toBlock: blockNumber,
        });
        setFromBlockUpdated(blockNumber + 1n);

        const newEvents = [];
        for (let i = logs.length - 1; i >= 0; i--) {
          newEvents.push({
            log: logs[i],
            args: logs[i].args,
            block:
              blockData && logs[i].blockHash === null
                ? null
                : await publicClient.getBlock({ blockHash: logs[i].blockHash as Hash }),
            transaction:
              transactionData && logs[i].transactionHash !== null
                ? await publicClient.getTransaction({ hash: logs[i].transactionHash as Hash })
                : null,
            receipt:
              receiptData && logs[i].transactionHash !== null
                ? await publicClient.getTransactionReceipt({ hash: logs[i].transactionHash as Hash })
                : null,
          });
        }
        if (events && append) {
          setEvents([...events, ...newEvents]);
        } else {
          setEvents(newEvents);
        }
        setError(undefined);
      }
    } catch (e: any) {
      console.error(e);
      setEvents(undefined);
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!deployedContractLoading) {
      readEvents({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    publicClient,
    fromBlock,
    contractName,
    eventName,
    deployedContractLoading,
    deployedContractData?.address,
    deployedContractData,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filters, replacer),
    blockData,
    transactionData,
    receiptData,
  ]);

  useInterval(
    async () => {
      if (!deployedContractLoading) {
        readEvents({ append: true });
      }
    },
    watch ? (configuredNetwork.id !== chains.hardhat.id ? scaffoldConfig.pollingInterval : 4_000) : null,
  );

  const eventHistoryData = useMemo(
    () =>
      events?.map(addIndexedArgsToEvent) as UseScaffoldEventHistoryData<
        TContractName,
        TEventName,
        TBlockData,
        TTransactionData,
        TReceiptData
      >,
    [events],
  );

  return {
    data: eventHistoryData,
    isLoading: isLoading,
    error: error,
  };
};

export const addIndexedArgsToEvent = (event: any) => {
  if (event.args && !Array.isArray(event.args)) {
    return { ...event, args: { ...event.args, ...Object.values(event.args) } };
  }

  return event;
};
