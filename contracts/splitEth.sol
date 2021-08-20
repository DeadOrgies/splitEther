// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

contract splitEth {

    string public message;
    address payable addr1;
    address payable addr2;


    function deposit() public payable {

        require(msg.value >= 1 ether);
    } 

    function transferEth(address payable _addr1, address payable _addr2) public payable {

        addr1 = _addr1;
        addr2 = _addr2;
        addr1.transfer(msg.value/2) ;     
        addr2.transfer(msg.value/2) ;     


    
    }

    function withdraw() public payable{

        payable(msg.sender).transfer(address(this).balance);    

    }


}
