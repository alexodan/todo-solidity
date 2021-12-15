// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const TodoList = await hre.ethers.getContractFactory("TodoList");
  const todoList = await TodoList.deploy();

  await todoList.deployed();

  console.log("todoList deployed to:", todoList.address);

  await todoList.addTask("Completar TodoList");
  await todoList.addTask("Completar Udemy solidity");
  await todoList.addTask("Enviar mail a jsc");

  const tasks = await todoList.getAllTasks();

  console.log(tasks.length);
  console.log(tasks[0].description);
  console.log(tasks[1].description);
  console.log(tasks[2].description);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });