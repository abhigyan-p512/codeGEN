// server/seed-problems.js
require("dotenv").config();
const mongoose = require("mongoose");
const Problem = require("./models/Problem");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/leetclone";

const problems = [
  {
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "Easy",
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    exampleTests: [
      {
        input: "4\n2 7 11 15\n9",
        output: "0 1",
        explanation: "Because nums[0] + nums[1] = 2 + 7 = 9",
      },
      {
        input: "3\n3 2 4\n6",
        output: "1 2",
        explanation: "nums[1] + nums[2] = 2 + 4 = 6",
      },
    ],
    starterCode: {
      javascript: `function twoSum(nums, target) {
  // Write solution here
  return [];
}

function main(){
  const fs = require('fs');
  const input = fs.readFileSync(0,'utf8').trim().split(/\\s+/).map(Number);
  const n = input[0];
  const nums = input.slice(1, n+1);
  const target = input[n+1];
  const result = twoSum(nums, target);
  console.log(result.join(" "));
}

main();`,
      python: `def twoSum(nums, target):
    # Write solution here
    return []

def main():
    import sys
    data = list(map(int, sys.stdin.read().strip().split()))
    n = data[0]
    nums = data[1:n+1]
    target = data[n+1]
    res = twoSum(nums, target)
    print(*res)

main()`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Write solution here
    return {};
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> nums(n);
    for(int i=0;i<n;i++) cin>>nums[i];
    int target;
    cin >> target;

    vector<int> res = twoSum(nums, target);
    for(int i=0;i<res.size();i++) cout<<res[i]<<" ";
    return 0;
}`,
    },
  },

  {
    title: "Reverse String",
    slug: "reverse-string",
    difficulty: "Easy",
    description:
      "Write a function that reverses a string. The input string is given as an array of characters.",
    exampleTests: [
      { input: "hello", output: "olleh", explanation: "Reverse letter order" },
      { input: "ChatGPT", output: "TPGtahC" },
    ],
    starterCode: {
      javascript: `function reverseString(s){
  return s.split("").reverse().join("");
}

function main(){
  const fs = require('fs');
  const input = fs.readFileSync(0,'utf8').trim();
  console.log(reverseString(input));
}

main();`,
    },
  },

  {
    title: "Fizz Buzz",
    slug: "fizz-buzz",
    difficulty: "Medium",
    description:
      "Given an integer n, return a string array answer where:\n" +
      "answer[i] == 'FizzBuzz' if i is divisible by 3 and 5,\n" +
      "answer[i] == 'Fizz' if i is divisible by 3,\n" +
      "answer[i] == 'Buzz' if i is divisible by 5,\n" +
      "answer[i] == i (as a string) otherwise.",
    exampleTests: [
      {
        input: "5",
        output: "1 2 Fizz 4 Buzz",
      },
      {
        input: "15",
        output: "1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz",
      },
    ],
    starterCode: {
      javascript: `function fizzBuzz(n){
  const result = [];
  for(let i=1;i<=n;i++){
    if(i%3===0 && i%5===0) result.push("FizzBuzz");
    else if(i%3===0) result.push("Fizz");
    else if(i%5===0) result.push("Buzz");
    else result.push(i.toString());
  }
  return result;
}

function main(){
  const fs = require('fs');
  const input = parseInt(fs.readFileSync(0,'utf8').trim());
  const result = fizzBuzz(input);
  console.log(result.join(" "));
}

main();`,
    },
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB");

    await Problem.deleteMany({});
    console.log("Cleared old problems");

    await Problem.insertMany(problems);
    console.log("Inserted new problems!");

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
