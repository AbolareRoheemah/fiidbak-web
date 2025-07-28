import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
  pinataGateway: "ipfs.io",
});

export async function uploadFileToPinata(file: File) {
    try {
      const upload = await pinata.upload.public.file(file);
      console.log("cid", upload?.cid)
      return upload?.cid || "";
    } catch (error) {
      console.log(error);
    }
}

export async function getUploadedFile(cid: string) {
    try {
      const url = await pinata.gateways.public.convert(cid);
      console.log("url", url)
      return url;
  
    } catch (error) {
      console.log(error);
    }
  }