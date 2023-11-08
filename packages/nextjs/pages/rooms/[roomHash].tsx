import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { NextPage } from "next";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useBlockNumber } from "wagmi";
import { BettingRoomAddress } from "~~/components/BettingRoomAddress";
import { MetaHeader } from "~~/components/MetaHeader";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractRead, useScaffoldContractWrite, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";

const RoomPage: NextPage = () => {
  const { address } = useAccount();

  const router = useRouter();
  const { roomHash } = router.query as { roomHash: `0x${string}` };

  const { data: blockNumber, isError: isErrorBlockNumber, isLoading: isLoadingBlockNumber } = useBlockNumber();

  const [members, setMembers] = useState<string[]>([]);
  const [winners, setWinners] = useState<string[]>([]);
  const [prizeClaimed, setPrizeClaimed] = useState<boolean>(false);
  const [room, setRoom] = useState<any>({});

  const {
    data: roomJoinEvents,
    isLoading: isLoadingRoomJoinEvents,
    error: errorReadingRoomJoinEvents,
  } = useScaffoldEventHistory({
    contractName: "BettingRoom",
    eventName: "RoomJoin",
    fromBlock: scaffoldConfig.fromBlock,
    filters: { roomHash: roomHash },
    watch: true,
    requiredFilters: ["roomHash"],
  });

  console.log("roomJoinEvents", roomJoinEvents);

  const {
    data: winnersFetchEvents,
    isLoading: isLoadingWinnersFetchEvents,
    error: errorReadingWinnersFetchEvents,
  } = useScaffoldEventHistory({
    contractName: "BettingRoom",
    eventName: "WinnersFetch",
    fromBlock: scaffoldConfig.fromBlock,
    filters: { roomHash: roomHash },
    watch: true,
    requiredFilters: ["roomHash"],
  });

  console.log("winnersFetchEvents", winnersFetchEvents);

  useEffect(() => {
    if (winnersFetchEvents && winnersFetchEvents.length === 1) {
      const eventRoomHash = winnersFetchEvents[0].log.args.roomHash;
      const eventWinners = winnersFetchEvents[0].log.args.winners;
      console.log("📡 WinnersFetch event", eventRoomHash, eventWinners);
      if (eventWinners && eventWinners.length > 0) {
        console.log("setWinners", eventWinners);
        setWinners(eventWinners as string[]);
      }
    }
  }, [winnersFetchEvents]);

  useEffect(() => {
    if (!isLoadingRoomJoinEvents && !errorReadingRoomJoinEvents && roomJoinEvents && roomJoinEvents.length > 0) {
      setMembers(roomJoinEvents.map(event => event.log.args.member as string));
    }
  }, [roomJoinEvents]);

  const {
    data: claimPrizeEvents,
    isLoading: isLoadingClaimPrizeEvents,
    error: errorReadingClaimPrizeEvents,
  } = useScaffoldEventHistory({
    contractName: "BettingRoom",
    eventName: "ClaimPrize",
    fromBlock: scaffoldConfig.fromBlock,
    filters: { roomHash: roomHash },
    requiredFilters: ["roomHash"],
  });

  console.log("claimPrizeEvents", claimPrizeEvents);

  useEffect(() => {
    if (
      !isLoadingClaimPrizeEvents &&
      !errorReadingClaimPrizeEvents &&
      claimPrizeEvents &&
      claimPrizeEvents.length > 0 &&
      claimPrizeEvents.filter(event => event.log.args.member === address).length > 0
    ) {
      setPrizeClaimed(true);
    }
  }, [claimPrizeEvents]);

  const {
    data: claimRefundEvents,
    isLoading: isLoadingClaimRefundEvents,
    error: errorReadingClaimRefundEvents,
  } = useScaffoldEventHistory({
    contractName: "BettingRoom",
    eventName: "ClaimRefund",
    fromBlock: scaffoldConfig.fromBlock,
    filters: { roomHash: roomHash },
    requiredFilters: ["roomHash"],
  });

  console.log("claimRefundEvents", claimRefundEvents);

  useEffect(() => {
    if (
      !isLoadingClaimRefundEvents &&
      !errorReadingClaimRefundEvents &&
      claimRefundEvents &&
      claimRefundEvents.length > 0 &&
      claimRefundEvents.filter(event => event.log.args.member === address).length > 0
    ) {
      setPrizeClaimed(true);
    }
  }, [claimRefundEvents]);

  const { data: roomData, isLoading: isLoadingRoomData } = useScaffoldContractRead({
    contractName: "BettingRoom",
    functionName: "rooms",
    args: [roomHash],
  });

  console.log("roomData", roomData);

  useEffect(() => {
    if (roomData) {
      setRoom({
        bet: roomData[6],
        balance: roomData[8],
        betDeadline: roomData[2],
        claimPrizeDeadline: roomData[3],
        gameAddress: roomData[9],
      });
    }
  }, [roomData]);

  const {
    writeAsync: joinRoom,
    isLoading: isLoadingJoinRoom,
    isMining: isMiningJoinRoom,
  } = useScaffoldContractWrite({
    contractName: "BettingRoom",
    functionName: "joinRoom",
    args: [roomHash],
    value: room.bet,
    onBlockConfirmation: (txnReceipt: { blockHash: any }) => {
      console.log("Transaction blockHash", txnReceipt.blockHash);
    },
  });

  const {
    writeAsync: fetchWinners,
    isLoading: isLoadingFetchWinners,
    isMining: isMiningFetchWinners,
  } = useScaffoldContractWrite({
    contractName: "BettingRoom",
    functionName: "fetchWinners",
    args: [roomHash],
    onBlockConfirmation: (txnReceipt: { blockHash: any }) => {
      console.log("Transaction blockHash", txnReceipt.blockHash);
    },
  });

  const {
    writeAsync: claimPrize,
    isLoading: isLoadingClaimPrize,
    isMining: isMiningClaimPrize,
  } = useScaffoldContractWrite({
    contractName: "BettingRoom",
    functionName: "claimPrize",
    args: [roomHash],
    onBlockConfirmation: (txnReceipt: { blockHash: any }) => {
      console.log("Transaction blockHash", txnReceipt.blockHash);
      setPrizeClaimed(true);
    },
  });

  const {
    writeAsync: claimRefund,
    isLoading: isLoadingClaimRefund,
    isMining: isMiningClaimRefund,
  } = useScaffoldContractWrite({
    contractName: "BettingRoom",
    functionName: "refundBet",
    args: [roomHash],
    onBlockConfirmation: (txnReceipt: { blockHash: any }) => {
      console.log("Transaction blockHash", txnReceipt.blockHash);
      setPrizeClaimed(true);
    },
  });

  const disabled =
    isLoadingJoinRoom ||
    isMiningJoinRoom ||
    isLoadingFetchWinners ||
    isMiningFetchWinners ||
    isLoadingClaimPrize ||
    isMiningClaimPrize ||
    isLoadingClaimRefund ||
    isMiningClaimRefund;
  const blockNumberLoaded = blockNumber !== undefined && !isErrorBlockNumber && !isLoadingBlockNumber;
  const winnersLoaded = !isLoadingWinnersFetchEvents && !errorReadingWinnersFetchEvents;
  const betDeadlineReached = blockNumberLoaded && blockNumber > room.betDeadline;
  const claimPrizeDeadlineReached = blockNumberLoaded && blockNumber > room.claimPrizeDeadline;

  return (
    <>
      <MetaHeader />
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center mb-4">
            <span className="block text-4xl font-bold mb-2">
              Room <BettingRoomAddress address={roomHash} />
            </span>
          </h1>
        </div>

        <div className="flex-grow bg-base-300 w-full mt-4 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            {isLoadingRoomData || !roomData || !room.bet ? (
              "Loading..."
            ) : (
              <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
                <p>Bet: Ξ{formatUnits(room.bet, 18)}</p>
                <p>Balance: Ξ{formatUnits(room.balance, 18)}</p>
                <p>Bet Deadline: block {formatUnits(room.betDeadline, 0)}</p>
                <p>Claim Prize Deadline: block {formatUnits(room.claimPrizeDeadline, 0)}</p>
                <p>
                  Game: <Address address={room.gameAddress} />
                </p>
                <p>
                  Members:
                  <ol>
                    {members.map((member, index) => {
                      return (
                        <li key={index}>
                          <Address address={member} />
                        </li>
                      );
                    })}
                  </ol>
                </p>

                {members.includes(address as string) ? (
                  <button className="btn btn-primary btn-sm mb-2" disabled={true}>
                    Joined
                  </button>
                ) : blockNumberLoaded && blockNumber > room.betDeadline ? (
                  <button className="btn btn-primary btn-sm mb-2" disabled={true}>
                    Bet Deadline Reached
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-sm mb-2"
                    disabled={disabled}
                    onClick={() => {
                      if (!roomHash || !roomData || !room.bet) {
                        return;
                      }
                      joinRoom();
                    }}
                  >
                    Join
                  </button>
                )}

                {betDeadlineReached && winnersLoaded && winners?.length === 0 && !claimPrizeDeadlineReached && (
                  <button
                    className="btn btn-primary btn-sm mb-2"
                    disabled={disabled}
                    onClick={() => {
                      if (!roomHash) {
                        return;
                      }
                      fetchWinners();
                    }}
                  >
                    Fetch Winners (get tip)
                  </button>
                )}

                {betDeadlineReached && winnersLoaded && winners?.length > 0 && (
                  <div>
                    <p>
                      Winners:
                      <ol>
                        {winners.map((winner, index) => {
                          return (
                            <li key={index}>
                              <Address address={winner} />
                            </li>
                          );
                        })}
                      </ol>
                    </p>
                    {winners.includes(address as string) && !claimPrizeDeadlineReached && !prizeClaimed && (
                      <button
                        className="btn btn-primary btn-sm mb-2"
                        disabled={disabled}
                        onClick={() => {
                          if (!roomHash) {
                            return;
                          }
                          claimPrize();
                        }}
                      >
                        Claim
                      </button>
                    )}
                    {winners.includes(address as string) && prizeClaimed && (
                      <button className="btn btn-primary btn-sm mb-2" disabled={true}>
                        Claimed
                      </button>
                    )}
                    {winners.includes(address as string) && !prizeClaimed && claimPrizeDeadlineReached && (
                      <button className="btn btn-primary btn-sm mb-2" disabled={true}>
                        Claim Deadline Reached
                      </button>
                    )}
                  </div>
                )}

                {claimPrizeDeadlineReached &&
                  room.balance > 0 &&
                  !prizeClaimed &&
                  members.includes(address as string) && (
                    <div>
                      <button
                        className="btn btn-primary btn-sm mb-2"
                        disabled={disabled}
                        onClick={() => {
                          if (!roomHash) {
                            return;
                          }
                          claimRefund();
                        }}
                      >
                        Claim Refund
                      </button>
                    </div>
                  )}

                {claimPrizeDeadlineReached && room.balance > 0 && prizeClaimed && (
                  <button className="btn btn-primary btn-sm mb-2" disabled={true}>
                    Refund Claimed
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RoomPage;
