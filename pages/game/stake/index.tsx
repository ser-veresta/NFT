import { TransactionResponse, Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { NextPage } from "next";
import useSWR from "swr";
import Nav from "../../../components/Nav";
import { fetcher } from "../../../utils/fetcher";
import ABI from "../../../utils/stake_abi.json";
import { useSelector } from "react-redux";
import { contractState } from "../../../redux/Contract";
import { useCallback, useEffect, useState } from "react";
import { Contract } from "@ethersproject/contracts";
import TokenData from "../../../components/TokenData";
import { toast } from "react-toastify";
import { ErrorCode } from "@ethersproject/logger";
import { hexValue } from "@ethersproject/bytes";
import { formatUnits } from "@ethersproject/units";
import Link from "next/link";
import Loader from "../../../components/Loader";

const stakeContractAddress = "0xc3Ee84204152C0D065D4D72f9f91ecB73D2bAb43";

const StakePage: NextPage = () => {
  const { tokenIds } = useSelector((state: any): contractState => state.contractReducer);

  const [isChain, setIsChain] = useState<number>(0);

  const [staking, setStaking] = useState<number>(0);
  const [tokenId] = useState<number[]>(tokenIds);

  const { library, account, chainId } = useWeb3React<Web3Provider>();

  const { data: balance, mutate: mutateBalance } = useSWR(["getBalance", account, "latest"], {
    fetcher: fetcher(library),
  });


  const { data: stakedTokens, mutate: mutateStakedTokens } = useSWR([stakeContractAddress, "stakedNfts"],
    {
      fetcher: fetcher(library, ABI.abi),
    }
  );

  const {
    data: stakeBalance,
    mutate: mutateStakeBalance,
  } = useSWR(stakedTokens && stakedTokens.length ? [stakeContractAddress, "NftBalances", tokenId] : null, {
    fetcher: fetcher(library, ABI.abi),
  });


  const {
    data: stakeWalletBalance,
    mutate: mutateStakeWalletBalance,
  } = useSWR([stakeContractAddress, "balanceOf", account], {
    fetcher: fetcher(library, ABI.abi),
  });




  const checkIsChain = useCallback(() => {
    setIsChain(0);

    if (chainId !== 80001) {
      if (!library || !library.provider || !library.provider.request) return;

      // try {
      //   library.provider.request({
      //     method: "wallet_switchEthereumChain",
      //     params: [{ chainId: hexValue(80001) }],
      //   });
      // } catch (error) {
      library.provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hexValue(80001),
            chainName: "Mumbai Testnet",
            rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
            nativeCurrency: {
              name: "MATIC",
              symbol: "MATIC",
              decimals: 18,
            },
            blockExplorerUrls: ["https://polygonscan.com/"],
          },
        ],
      });

      library.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexValue(80001) }],
      });

      setIsChain(1);
      mutateBalance(undefined, true);
    }

    if (chainId === 80001) {
      setIsChain(1);
    }
  }, [chainId, library, mutateBalance]);

  useEffect(() => {
    checkIsChain();
  }, [chainId, checkIsChain]);

  const notify = useCallback((type: "error" | "success", message: string) => {
    toast(message, { type });
  }, []);


  const onStake = async (tokenId: number) => {
    let stake = true;

    console.log(isChain)
    if (!isChain) return;

    console.log("Staking ... ");
    setStaking(1);

    if (stakedTokens && stakedTokens.length) {
      let arr = stakedTokens.map(formatUnits);

      if (arr.includes(tokenId.toString())) {
        stake = false;
      }
    }

    const contract = new Contract(stakeContractAddress, ABI.abi, library?.getSigner());

    try {
      if (!account) throw "Connect to Wallet";

      let test = await contract.callStatic.stakeorUnstakeNft(tokenId, stake, account);
      console.log(test);
      contract.on("status", (...args) => {
        console.log(args);

        mutateBalance(undefined, true);
        mutateStakedTokens(undefined, true);
        mutateStakeBalance(undefined, true);
        mutateStakeWalletBalance(undefined, true);



        contract.removeAllListeners();
      });
      const txn: TransactionResponse = await contract.stakeorUnstakeNft(tokenId, stake, account);

      let receipt = await txn.wait();
      console.log(txn, receipt);




      notify("success", "Mint Successfull,It May Take Couple of Minutes for the transaction to reflect");

      setStaking(0);
    } catch (err) {
      const error: any = err;
      setStaking(0);

      console.log({ err });

      if (error.code && error.code in ErrorCode) {
        return notify("error", error.error ? error.error.message : error.reason);
      } else {
        return notify("error", error.message || "Internal Error");
      }
    }
  };

  return (
    <div className="font-Quicksand">
      <Nav balance={balance} checkIsChain={checkIsChain} />
      <div className="w-11/12 m-auto">
        <div className="mt-10 flex w-full">
          <div className="flex flex-col gap-2 items-start">
            <p>
              <strong>Available Game tokens: </strong>
              {stakeBalance ? (parseFloat(formatUnits(stakeBalance)) * (10 ** 18) + (stakeWalletBalance && parseFloat(formatUnits(stakeWalletBalance)))) : stakeWalletBalance ? formatUnits(stakeWalletBalance) : "0.0"}
            </p>
            <p className="text-2xl font-semibold mt-10">Tokens Available for Staking</p>
            {tokenId.length ? (
              tokenId.map((token, idx) => (
                <div
                  className={(() => {
                    let classes = ""
                    let arr = stakedTokens ? stakedTokens.map(formatUnits) : [];

                    if (staking) classes += "cursor-not-allowed"
                    else classes += "cursor-pointer"

                    if (arr.includes(token.toString())) classes += ` relative cursor-not-allowed
                    after:absolute
                    after:top-0
                    after:right-0
                    after:w-full
                    after:h-full
                    after:content-['Staked']
                    after:z-10
                    after:flex
                    after:justify-center
                    after:items-center
                    after:text-xl
                    after:font-semibold
                    before:absolute 
                    before:top-0 
                    before:right-0 
                    before:w-full 
                    before:h-full 
                    before:bg-primary-dark 
                    before:content-[''] 
                    before:rounded-md`
                    else classes += ` relative
                    after:absolute
                    after:top-0
                    after:right-0
                    after:w-full
                    after:h-full
                    after:content-['Click_To_Stake']
                    after:z-10
                    after:flex
                    after:justify-center
                    after:items-center
                    after:text-xl
                    after:font-semibold
                    before:absolute
                    before:top-0
                    before:right-0
                    before:w-full
                    before:h-full
                    before:bg-primary-light
                    before:content-['']
                    before:rounded-md`


                    return classes
                  })()}
                  key={idx}
                  onClick={() => onStake(token)}
                >
                  <TokenData library={library} token={token} />
                </div>
              ))
            ) : (
              <p>No tokens found, Mint some tokens <span className="font-bold hover:underline"><Link href="/">Here</Link></span> </p>
            )}
          </div>
          <div></div>
        </div>
      </div>
      {staking ? <Loader text={"Staking the token, Please Wait......"} /> : null}
    </div>
  );
};

export default StakePage;
