import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BettingRoomAddress } from "~~/components/BettingRoomAddress";
import { MetaHeader } from "~~/components/MetaHeader";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";

const Home: NextPage = () => {
  const { address } = useAccount();

  const {
    data: roomJoinEvents,
    isLoading: isLoadingRoomJoinEvents,
    error: errorReadingRoomJoinEvents,
  } = useScaffoldEventHistory({
    contractName: "BettingRoom",
    eventName: "RoomJoin",
    fromBlock: scaffoldConfig.fromBlock,
    filters: { member: address },
    requiredFilters: ["member"],
  });

  console.log("roomJoinEvents", roomJoinEvents);

  return (
    <>
      <MetaHeader />
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center mb-4">
            <span className="block text-4xl font-bold mb-2">Rooms Joined</span>
            <button className="btn btn-primary btn-sm">
              <Link href="/create-room">Create Room</Link>
            </button>
          </h1>
        </div>

        <div className="flex-grow bg-base-300 w-full mt-4 px-8 py-12">
          <div className="flex grid grid-cols-5 justify-center items-center gap-12 flex-col sm:flex-row">
            {isLoadingRoomJoinEvents || errorReadingRoomJoinEvents
              ? "Loading..."
              : roomJoinEvents?.map((event, index) => {
                  return (
                    <div
                      key={index}
                      className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl"
                    >
                      <p>
                        Room: <BettingRoomAddress address={event.log.args.roomHash} />
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

export default Home;
