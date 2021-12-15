//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract TodoList {
    uint public taskCount = 0;
    mapping(uint => TodoItem) public tasks; // { task1: { taskObject } }
    mapping(address => uint[]) public userTasks; // { userId1: { task1, task2, task3... } }

    struct TodoItem {
        uint id;
        string description;
        bool isCompleted;
    }

    constructor() {}

    function getCount() public view returns (uint) {
        return taskCount;
    }

    function addTask(string memory description) public returns (TodoItem memory) {
        address sender = msg.sender;
        TodoItem memory newItem = TodoItem(taskCount, description, false);
        tasks[taskCount] = newItem;
        userTasks[sender].push(taskCount);
        taskCount += 1;
        return newItem;
    }

    function getAllUserTasks() public view returns (TodoItem[] memory) {
        TodoItem[] memory allUserTasks = new TodoItem[](taskCount);
        for (uint i = 0; i < userTasks[msg.sender].length; i++) {
            allUserTasks[i] = tasks[userTasks[msg.sender][i]];
        }
        return allUserTasks;
    }
}
