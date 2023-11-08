import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NextPage } from "next";
import { parseEther } from "viem";
import { getAddress } from "viem";
import { MetaHeader } from "~~/components/MetaHeader";
import { AddressInput, EtherInput, InputBase } from "~~/components/scaffold-eth";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const router = useRouter();

  const [betDeadline, setBetDeadline] = useState<string>("");
  const [resultDeadline, setResultDeadline] = useState<string>("");
  const [bet, setBet] = useState<string>("");
  const [resultContractAddress, setResultContractAddress] = useState<string>("");

  const {
    writeAsync: create,
    isLoading: isLoadingCreate,
    isMining: isMiningCreate,
  } = useScaffoldContractWrite({
    contractName: "BettingRoom",
    functionName: "createRoom",
    args: [resultContractAddress, parseEther(bet), BigInt(betDeadline), BigInt(resultDeadline)],
    onBlockConfirmation: txnReceipt => {
      console.log("Transaction: ", txnReceipt);
      const newRoomHash = getAddress(`0x${txnReceipt.logs[0].topics[1]?.substring(26)}`);
      console.log("newRoomHash", newRoomHash);
      router.push(`rooms/${newRoomHash}`);
    },
  });

  const {
    writeAsync: createAndJoin,
    isLoading: isLoadingCreateAndJoin,
    isMining: isMiningCreateAndJoin,
  } = useScaffoldContractWrite({
    contractName: "BettingRoom",
    functionName: "createRoomAndJoin",
    args: [resultContractAddress, parseEther(bet), BigInt(betDeadline), BigInt(resultDeadline)],
    value: parseEther(bet),
    onBlockConfirmation: txnReceipt => {
      console.log("Transaction: ", txnReceipt);
      const newRoomHash = getAddress(`0x${txnReceipt.logs[0].topics[1]?.substring(26)}`);
      console.log("newRoomHash", newRoomHash);
      router.push(`rooms/${newRoomHash}`);
    },
  });

  const disabled = isLoadingCreate || isMiningCreate || isLoadingCreateAndJoin || isMiningCreateAndJoin;

  const createRoom = async () => {
    try {
      if (disabled) {
        return;
      }

      if (!resultContractAddress) {
        alert("Please input game address");
        return;
      }

      if (!betDeadline) {
        alert("Please input bet deadline");
        return;
      }

      if (!resultDeadline) {
        alert("Please input claim prize deadline");
        return;
      }

      if (!bet || parseEther(bet) == BigInt(0)) {
        alert("Please input bet amount");
        return;
      }

      await create();
    } catch (e) {
      console.log("error", e);
    }
  };

  const createRoomAndJoin = async () => {
    try {
      if (disabled) {
        return;
      }

      if (!resultContractAddress) {
        alert("Please input game address");
        return;
      }

      if (!betDeadline) {
        alert("Please input bet deadline");
        return;
      }

      if (!resultDeadline) {
        alert("Please input claim prize deadline");
        return;
      }

      if (!bet || parseEther(bet) == BigInt(0)) {
        alert("Please input bet amount");
        return;
      }

      await createAndJoin();
    } catch (e) {
      console.log("error", e);
    }
  };

  return (
    <>
      <MetaHeader />
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center mb-4">
            <span className="block text-4xl font-bold mb-2">Create Room</span>
          </h1>
        </div>

        <div className="flex-grow bg-base-300 w-full mt-4 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-s rounded-3xl">
              <p>
                Bet: <EtherInput value={bet} onChange={amount => setBet(amount)} />
              </p>
              <p>
                Bet Deadline (block):{" "}
                <InputBase name="betDeadline" placeholder="1000" value={betDeadline} onChange={setBetDeadline} />
              </p>
              <p>
                Claim Prize Deadline (block):{" "}
                <InputBase
                  name="resultDeadline"
                  placeholder="1200"
                  value={resultDeadline}
                  onChange={setResultDeadline}
                />
              </p>
              <p>
                Game:{" "}
                <AddressInput
                  onChange={setResultContractAddress}
                  value={resultContractAddress}
                  placeholder="Game address"
                />
              </p>
              <div>
                <button className="btn btn-primary btn-sm" onClick={createRoom} disabled={disabled}>
                  Create
                </button>
                <button className="btn btn-primary btn-sm ml-4" onClick={createRoomAndJoin} disabled={disabled}>
                  Create and Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
