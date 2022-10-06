import { Web3Provider } from "@ethersproject/providers";
import { formatEther } from "@ethersproject/units";
import { useWeb3React } from "@web3-react/core";
import Link from "next/link";
import { injectedConnector } from "../utils/web3.config";

interface props {
  balance: any;
  tokenBalance: any;
}

const Nav: React.FC<props> = ({ balance, tokenBalance }) => {
  const { activate, account, active } = useWeb3React<Web3Provider>();

  // To Handle Wallet Connection
  const connectWallet = async () => {
    activate(injectedConnector);
  };

  return (
    <>
      <div className="bg-primary-main h-nav shadow-sm">
        <div className="w-11/12 flex justify-around items-center h-full m-auto">
          <h1 className="text-3xl font-bold">
            <Link href="/">NFT</Link>
          </h1>
          <div className="flex-grow"></div>
          <div className="text-xl font-bold">
            <Link href="/admin">Whitelist</Link>
          </div>
          <div className="flex-grow"></div>
          {active && balance && tokenBalance ? (
            <div className="font-semibold flex gap-2">
              <div>
                <span className="text-lg font-bold">Acc: </span>
                {account?.slice(0, 6)}........{account?.slice(account.length - 2)} |
              </div>
              <div>
                <span className="text-lg font-bold">Balance: </span>
                {parseFloat(formatEther(balance)) + " ETH"} |
              </div>
              <div>
                <span className="text-lg font-bold">Owned: </span>
                {parseFloat(tokenBalance.toNumber()).toPrecision(2)}
              </div>
            </div>
          ) : (
            <button
              className="bg-primary-lighter p-2 px-4 rounded-3xl hover:bg-primary-light shadow-md active:shadow-sm font-bold"
              onClick={connectWallet}
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Nav;
