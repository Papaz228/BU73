import { ethers } from 'hardhat';

async function main() {
    const admins = await ethers.getSigners();

    const Multisig = await ethers.getContractFactory("Multisig");
    const multisig = await Multisig.deploy([
        admins[0].address,
        admins[1].address, 
        admins[2].address, 
        admins[3].address, 
        admins[4].address
    ]);
    await multisig.deployed();

    const Target = await ethers.getContractFactory("Target");
    const target = await Target.deploy(multisig.address);
    await target.deployed();

    const nonce = await multisig._nonce();
    const iface = new ethers.utils.Interface(["function setNumber(uint256)"]);
    const payload = iface.encodeFunctionData("setNumber", [100]);
    console.log("payload:\n", payload);

    const message = ethers.utils.solidityPack(
        ["uint256", "address", "address", "bytes"],
        [nonce, multisig.address, target.address, payload]
    );
    console.log("message:\n", message);

    const bMessage = ethers.utils.arrayify(message);
    console.log("bMessage:\n", bMessage);

    let signatures: {
        v: number[],
        r: string[],
        s: string[]
    };
    signatures = {
        v: [],
        r: [],
        s: []
    };
    for(let i = 0; i < 3; i++) {
        const powSignature = await admins[i].signMessage(bMessage);
        const signature = ethers.utils.splitSignature(powSignature);
        signatures.v.push(signature.v);
        signatures.r.push(signature.r);
        signatures.s.push(signature.s);
    }
    console.log("signatures:\n", signatures);
    
    console.log("number:\n", await target.number());
    await multisig.verify(nonce, target.address, payload, signatures.v, signatures.r, signatures.s);
    console.log("number:\n", await target.number());
    
}


main()