import Link from "next/link";
import type { NextPage } from "next";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { BettingRoomAddress } from "~~/components/BettingRoomAddress";
import { MetaHeader } from "~~/components/MetaHeader";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";

const Rooms: NextPage = () => {
  const { address } = useAccount();

  const {
    data: roomCreateEvents,
    isLoading: isLoadingRoomCreateEvents,
    error: errorReadingRoomCreateEvents,
  } = useScaffoldEventHistory({
    contractName: "BettingRoom",
    eventName: "RoomCreate",
    fromBlock: scaffoldConfig.fromBlock,
    filters: { creator: address },
    requiredFilters: ["creator"],
  });

  console.log("roomCreateEvents", roomCreateEvents);

  return (
    <>
      <MetaHeader />
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center mb-4">
            <span className="block text-4xl font-bold mb-2">Rooms Created</span>
            <button className="btn btn-primary btn-sm">
              <Link href="/create-room">Create Room</Link>
            </button>
          </h1>
        </div>

        <div className="flex-grow bg-base-300 w-full mt-4 px-8 py-12">
          <div className="flex grid grid-cols-5 justify-center items-center gap-12 flex-col sm:flex-row">
            {isLoadingRoomCreateEvents || errorReadingRoomCreateEvents
              ? "Loading..."
              : roomCreateEvents?.map((event, index) => {
                  return (
                    <div
                      key={index}
                      className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl"
                    >
                      <p>
                        Room: <BettingRoomAddress address={event.log.args.roomHash} />
                      </p>
                      <p>Bet: Ξ{event.log.args.betValue ? formatUnits(event.log.args.betValue, 18) : 0}</p>
                      <p>
                        Bet Deadline: block{" "}
                        {event.log.args.betDeadline ? formatUnits(event.log.args.betDeadline, 0) : 0}
                      </p>
                      <p>
                        Claim Prize Deadline: block{" "}
                        {event.log.args.resultDeadline ? formatUnits(event.log.args.resultDeadline, 0) : 0}
                      </p>
                      <p>
                        Game: <Address address={event.log.args.resultContractAddress} />
                      </p>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Rooms;
