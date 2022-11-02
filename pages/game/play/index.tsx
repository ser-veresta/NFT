import { hexValue } from "@ethersproject/bytes";
import { Contract } from "@ethersproject/contracts";
import { TransactionResponse, Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { NextPage } from "next";
import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import ABI from "../../../utils/game_abi.json"
import STAKE_ABI from "../../../utils/stake_abi.json";
import Nav from "../../../components/Nav";
import { fetcher } from "../../../utils/fetcher";
import { toast } from "react-toastify";
import { ErrorCode } from "@ethersproject/logger";
import TokenData from "../../../components/TokenData";

const gameContractAddress = "0xE5E5FDf09A8a2eF018b94b5b6b96Ff175b7DE54d"
const stakeContractAddress = "0xc3Ee84204152C0D065D4D72f9f91ecB73D2bAb43";

const PlayPage: NextPage = () => {

    const { library, account, chainId, active } = useWeb3React<Web3Provider>();

    const [isChain, setIsChain] = useState<number>(0);

    const [minting, setMinting] = useState<number>(0);

    const [tokenId, setTokenID] = useState<number[]>([]);


    const { data: balance, mutate: mutateBalance } = useSWR(["getBalance", account, "latest"], {
        fetcher: fetcher(library),
    });

    const { data: block, mutate: mutateBlock } = useSWR(["getBlockNumber"], {
        fetcher: fetcher(library),
    });

    const {
        data: stakeWalletBalance,
        mutate: mutateStakeWalletBalance,
    } = useSWR([stakeContractAddress, "balanceOf", account], {
        fetcher: fetcher(library, STAKE_ABI.abi),
    });


    const {
        data,
        mutate: mutateNfts
    } = useSWR([gameContractAddress, "ownedNfts", account], {
        fetcher: fetcher(library, ABI.abi),
    });

    const notify = useCallback((type: "error" | "success", message: string) => {
        toast(message, { type });
    }, []);


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



    const getTokenID = useCallback(async () => {
        if (!isChain) return;

        try {
            mutateNfts(undefined, true);

            if (data) {
                let arr = [];
                for (let i = 0; i < data.length; i++) {
                    if (data[i] == account) {
                        arr.push(i)
                    }
                }
                setTokenID(arr)
            }
        } catch (error) {
            console.log(error);
        } finally {
            console.log(data)
        }
    }, [isChain, data, account, mutateNfts]);

    useEffect(() => {
        if (!library) return;

        (async () => {
            await getTokenID();
        })();

    }, [library, block, getTokenID])

    const handleMint = async () => {
        console.log("Minting ... ");
        setMinting(1);

        const contract = new Contract(gameContractAddress, ABI.abi, library?.getSigner());
        const stake_contract = new Contract(stakeContractAddress, STAKE_ABI.abi, library?.getSigner());

        try {
            if (!isChain) throw { message: "Please Connect to polygon mumbai Network to Mint!!" };

            if (!stakeWalletBalance) {
                mutateStakeWalletBalance(undefined, true);
                throw { message: "Game Token Balance Could not be retrieved, try again after some time ..!" }
            }

            let test = await stake_contract.callStatic.approve(gameContractAddress, stakeWalletBalance);
            console.log(test);
            let txn: TransactionResponse = await stake_contract.approve(gameContractAddress, stakeWalletBalance);

            let receipt = await txn.wait();

            test = await contract.callStatic.mintNft(account);
            console.log(test);
            txn = await contract.mintNft(account);

            receipt = await txn.wait();
            console.log(txn, receipt);

            mutateBalance(undefined, true);
            mutateStakeWalletBalance(undefined, true);
            mutateBlock(undefined, true);
            await getTokenID();

            notify("success", "Mint Successfull,It May Take Couple of Minutes for the transaction to reflect");
            setMinting(0);
        } catch (err) {
            const error: any = err;
            setMinting(0);

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
                <div className="mt-10 flex flex-col w-full">
                    <div>
                        <button
                            disabled={!active || minting === 1}
                            onClick={handleMint}
                            className="p-3 bg-primary-light hover:bg-primary-main shadow-md active:shadow rounded-md px-14 disabled:cursor-not-allowed disabled:bg-primary-dark"
                        >
                            Get Pets with Game Tokens
                        </button>
                    </div>

                    <div className="my-10">
                        <h1 className="text-2xl font-semibold underline">Your NFT&apos;s</h1>
                        <div className="flex gap-2 mt-5">
                            {tokenId.length ? (
                                tokenId.map((token, idx) => <TokenData key={idx} token={token} library={library} pets={true} />)
                            ) : (
                                <div className="mt-5">
                                    You own <strong>Zero</strong> NFT&apos;s <strong>(or)</strong> connect to a <strong>Wallet</strong> to view
                                    your NFT&apos;s
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PlayPage;