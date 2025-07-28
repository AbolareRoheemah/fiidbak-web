// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/Fiidbak.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        Fiidbak fiidbak = new Fiidbak();
        
        console.log("Fiidbak deployed to:", address(fiidbak));
        console.log("Owner:", fiidbak.owner());
        console.log("Creation Fee:", fiidbak.productCreationFee());
        console.log("Feedback Reward:", fiidbak.feedbackReward());
        
        vm.stopBroadcast();
    }
}