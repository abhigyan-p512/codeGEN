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

  {
    title: "Valid Palindrome",
    slug: "valid-palindrome",
    difficulty: "Easy",
    description:
      "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string s, return true if it is a palindrome, or false otherwise.",
    exampleTests: [
      {
        input: "A man, a plan, a canal: Panama",
        output: "true",
        explanation: "amanaplanacanalpanama is a palindrome",
      },
      {
        input: "race a car",
        output: "false",
      },
      {
        input: " ",
        output: "true",
      },
    ],
    starterCode: {
      javascript: `function isPalindrome(s) {
  // Write solution here
  return false;
}

function main(){
  const fs = require('fs');
  const input = fs.readFileSync(0,'utf8').trim();
  const result = isPalindrome(input);
  console.log(result ? "true" : "false");
}

main();`,
      python: `def isPalindrome(s):
    # Write solution here
    return False

def main():
    import sys
    s = sys.stdin.read().strip()
    result = isPalindrome(s)
    print("true" if result else "false")

main()`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

bool isPalindrome(string s) {
    // Write solution here
    return false;
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    string s;
    getline(cin, s);
    cout << (isPalindrome(s) ? "true" : "false");
    return 0;
}`,
    },
  },

  {
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    difficulty: "Easy",
    description:
      "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
    exampleTests: [
      {
        input: "6\n7 1 5 3 6 4",
        output: "5",
        explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5",
      },
      {
        input: "5\n7 6 4 3 1",
        output: "0",
        explanation: "No profit can be made",
      },
    ],
    starterCode: {
      javascript: `function maxProfit(prices) {
  // Write solution here
  return 0;
}

function main(){
  const fs = require('fs');
  const input = fs.readFileSync(0,'utf8').trim().split(/\\s+/).map(Number);
  const n = input[0];
  const prices = input.slice(1, n+1);
  const result = maxProfit(prices);
  console.log(result);
}

main();`,
      python: `def maxProfit(prices):
    # Write solution here
    return 0

def main():
    import sys
    data = list(map(int, sys.stdin.read().strip().split()))
    n = data[0]
    prices = data[1:n+1]
    result = maxProfit(prices)
    print(result)

main()`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

int maxProfit(vector<int>& prices) {
    // Write solution here
    return 0;
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    int n;
    cin >> n;
    vector<int> prices(n);
    for(int i=0;i<n;i++) cin>>prices[i];
    
    cout << maxProfit(prices);
    return 0;
}`,
    },
  },

  {
    title: "Contains Duplicate",
    slug: "contains-duplicate",
    difficulty: "Easy",
    description:
      "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
    exampleTests: [
      {
        input: "4\n1 2 3 1",
        output: "true",
      },
      {
        input: "4\n1 2 3 4",
        output: "false",
      },
      {
        input: "5\n1 1 1 3 3 4 3 2 4 2",
        output: "true",
      },
    ],
    starterCode: {
      javascript: `function containsDuplicate(nums) {
  // Write solution here
  return false;
}

function main(){
  const fs = require('fs');
  const input = fs.readFileSync(0,'utf8').trim().split(/\\s+/).map(Number);
  const n = input[0];
  const nums = input.slice(1, n+1);
  const result = containsDuplicate(nums);
  console.log(result ? "true" : "false");
}

main();`,
      python: `def containsDuplicate(nums):
    # Write solution here
    return False

def main():
    import sys
    data = list(map(int, sys.stdin.read().strip().split()))
    n = data[0]
    nums = data[1:n+1]
    result = containsDuplicate(nums)
    print("true" if result else "false")

main()`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

bool containsDuplicate(vector<int>& nums) {
    // Write solution here
    return false;
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    int n;
    cin >> n;
    vector<int> nums(n);
    for(int i=0;i<n;i++) cin>>nums[i];
    
    cout << (containsDuplicate(nums) ? "true" : "false");
    return 0;
}`,
    },
  },

  {
    title: "Valid Anagram",
    slug: "valid-anagram",
    difficulty: "Easy",
    description:
      "Given two strings s and t, return true if t is an anagram of s, and false otherwise. An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
    exampleTests: [
      {
        input: "anagram\nnagaram",
        output: "true",
      },
      {
        input: "rat\ncar",
        output: "false",
      },
    ],
    starterCode: {
      javascript: `function isAnagram(s, t) {
  // Write solution here
  return false;
}

function main(){
  const fs = require('fs');
  const input = fs.readFileSync(0,'utf8').trim().split('\\n');
  const s = input[0];
  const t = input[1];
  const result = isAnagram(s, t);
  console.log(result ? "true" : "false");
}

main();`,
      python: `def isAnagram(s, t):
    # Write solution here
    return False

def main():
    import sys
    lines = sys.stdin.read().strip().split('\\n')
    s = lines[0]
    t = lines[1]
    result = isAnagram(s, t)
    print("true" if result else "false")

main()`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

bool isAnagram(string s, string t) {
    // Write solution here
    return false;
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    string s, t;
    cin >> s >> t;
    cout << (isAnagram(s, t) ? "true" : "false");
    return 0;
}`,
    },
  },

  {
    title: "Maximum Subarray",
    slug: "maximum-subarray",
    difficulty: "Medium",
    description:
      "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum. A subarray is a contiguous part of an array.",
    exampleTests: [
      {
        input: "9\n-2 1 -3 4 -1 2 1 -5 4",
        output: "6",
        explanation: "[4,-1,2,1] has the largest sum = 6",
      },
      {
        input: "1\n1",
        output: "1",
      },
      {
        input: "5\n5 4 -1 7 8",
        output: "23",
      },
    ],
    starterCode: {
      javascript: `function maxSubArray(nums) {
  // Write solution here
  return 0;
}

function main(){
  const fs = require('fs');
  const input = fs.readFileSync(0,'utf8').trim().split(/\\s+/).map(Number);
  const n = input[0];
  const nums = input.slice(1, n+1);
  const result = maxSubArray(nums);
  console.log(result);
}

main();`,
      python: `def maxSubArray(nums):
    # Write solution here
    return 0

def main():
    import sys
    data = list(map(int, sys.stdin.read().strip().split()))
    n = data[0]
    nums = data[1:n+1]
    result = maxSubArray(nums)
    print(result)

main()`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

int maxSubArray(vector<int>& nums) {
    // Write solution here
    return 0;
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    int n;
    cin >> n;
    vector<int> nums(n);
    for(int i=0;i<n;i++) cin>>nums[i];
    
    cout << maxSubArray(nums);
    return 0;
}`,
    },
  },

  {
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    difficulty: "Medium",
    description:
      "Given a string s, find the length of the longest substring without repeating characters.",
    exampleTests: [
      {
        input: "abcabcbb",
        output: "3",
        explanation: "The answer is 'abc', with the length of 3",
      },
      {
        input: "bbbbb",
        output: "1",
        explanation: "The answer is 'b', with the length of 1",
      },
      {
        input: "pwwkew",
        output: "3",
        explanation: "The answer is 'wke', with the length of 3",
      },
    ],
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {
  // Write solution here
  return 0;
}

function main(){
  const fs = require('fs');
  const input = fs.readFileSync(0,'utf8').trim();
  const result = lengthOfLongestSubstring(input);
  console.log(result);
}

main();`,
      python: `def lengthOfLongestSubstring(s):
    # Write solution here
    return 0

def main():
    import sys
    s = sys.stdin.read().strip()
    result = lengthOfLongestSubstring(s)
    print(result)

main()`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

int lengthOfLongestSubstring(string s) {
    // Write solution here
    return 0;
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    string s;
    cin >> s;
    cout << lengthOfLongestSubstring(s);
    return 0;
}`,
    },
  },

  {
    title: "3Sum",
    slug: "3sum",
    difficulty: "Medium",
    description:
      "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. Notice that the solution set must not contain duplicate triplets.",
    exampleTests: [
      {
        input: "6\n-1 0 1 2 -1 -4",
        output: "-1 -1 2 -1 0 1",
        explanation: "The distinct triplets are [-1,-1,2] and [-1,0,1]",
      },
      {
        input: "3\n0 1 1",
        output: "",
      },
      {
        input: "3\n0 0 0",
        output: "0 0 0",
      },
    ],
    starterCode: {
      javascript: `function threeSum(nums) {
  // Write solution here
  return [];
}

function main(){
  const fs = require('fs');
  const input = fs.readFileSync(0,'utf8').trim().split(/\\s+/).map(Number);
  const n = input[0];
  const nums = input.slice(1, n+1);
  const result = threeSum(nums);
  if(result.length === 0) {
    console.log("");
  } else {
    const flat = result.flat().join(" ");
    console.log(flat);
  }
}

main();`,
      python: `def threeSum(nums):
    # Write solution here
    return []

def main():
    import sys
    data = list(map(int, sys.stdin.read().strip().split()))
    n = data[0]
    nums = data[1:n+1]
    result = threeSum(nums)
    if not result:
        print("")
    else:
        flat = [str(x) for sublist in result for x in sublist]
        print(" ".join(flat))

main()`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

vector<vector<int>> threeSum(vector<int>& nums) {
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
    
    vector<vector<int>> result = threeSum(nums);
    if(result.empty()) {
        cout << "";
    } else {
        for(auto& triplet : result) {
            for(int x : triplet) cout << x << " ";
        }
    }
    return 0;
}`,
    },
  },

  {
    title: "Product of Array Except Self",
    slug: "product-of-array-except-self",
    difficulty: "Medium",
    description:
      "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i]. The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer. You must write an algorithm that runs in O(n) time and without using the division operator.",
    exampleTests: [
      {
        input: "4\n1 2 3 4",
        output: "24 12 8 6",
        explanation: "answer[0] = 2*3*4 = 24, answer[1] = 1*3*4 = 12, etc.",
      },
      {
        input: "2\n-1 1",
        output: "1 -1",
      },
    ],
    starterCode: {
      javascript: `function productExceptSelf(nums) {
  // Write solution here
  return [];
}

function main(){
  const fs = require('fs');
  const input = fs.readFileSync(0,'utf8').trim().split(/\\s+/).map(Number);
  const n = input[0];
  const nums = input.slice(1, n+1);
  const result = productExceptSelf(nums);
  console.log(result.join(" "));
}

main();`,
      python: `def productExceptSelf(nums):
    # Write solution here
    return []

def main():
    import sys
    data = list(map(int, sys.stdin.read().strip().split()))
    n = data[0]
    nums = data[1:n+1]
    result = productExceptSelf(nums)
    print(*result)

main()`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

vector<int> productExceptSelf(vector<int>& nums) {
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
    
    vector<int> result = productExceptSelf(nums);
    for(int x : result) cout << x << " ";
    return 0;
}`,
    },
  },

  {
    title: "Group Anagrams",
    slug: "group-anagrams",
    difficulty: "Medium",
    description:
      "Given an array of strings strs, group the anagrams together. You can return the answer in any order. An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
    exampleTests: [
      {
        input: "6\neat tea tan ate nat bat",
        output: "bat eat tea ate tan nat",
        explanation: "Groups: [bat], [eat,tea,ate], [tan,nat]",
      },
      {
        input: "1\n",
        output: "",
      },
      {
        input: "1\na",
        output: "a",
      },
    ],
    starterCode: {
      javascript: `function groupAnagrams(strs) {
  // Write solution here
  return [];
}

function main(){
  const fs = require('fs');
  const input = fs.readFileSync(0,'utf8').trim().split(/\\s+/);
  const n = parseInt(input[0]);
  const strs = input.slice(1, n+1);
  const result = groupAnagrams(strs);
  if(result.length === 0) {
    console.log("");
  } else {
    const flat = result.flat().join(" ");
    console.log(flat);
  }
}

main();`,
      python: `def groupAnagrams(strs):
    # Write solution here
    return []

def main():
    import sys
    data = sys.stdin.read().strip().split()
    n = int(data[0])
    strs = data[1:n+1] if n > 0 else []
    result = groupAnagrams(strs)
    if not result:
        print("")
    else:
        flat = [s for group in result for s in group]
        print(" ".join(flat))

main()`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

vector<vector<string>> groupAnagrams(vector<string>& strs) {
    // Write solution here
    return {};
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    int n;
    cin >> n;
    vector<string> strs(n);
    for(int i=0;i<n;i++) cin>>strs[i];
    
    vector<vector<string>> result = groupAnagrams(strs);
    if(result.empty()) {
        cout << "";
    } else {
        for(auto& group : result) {
            for(string& s : group) cout << s << " ";
        }
    }
    return 0;
}`,
    },
  },

  {
    title: "Trapping Rain Water",
    slug: "trapping-rain-water",
    difficulty: "Hard",
    description:
      "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    exampleTests: [
      {
        input: "12\n0 1 0 2 1 0 1 3 2 1 2 1",
        output: "6",
        explanation: "The elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped.",
      },
      {
        input: "3\n4 2 0 3 2 5",
        output: "9",
      },
    ],
    starterCode: {
      javascript: `function trap(height) {
  // Write solution here
  return 0;
}

function main(){
  const fs = require('fs');
  const input = fs.readFileSync(0,'utf8').trim().split(/\\s+/).map(Number);
  const n = input[0];
  const height = input.slice(1, n+1);
  const result = trap(height);
  console.log(result);
}

main();`,
      python: `def trap(height):
    # Write solution here
    return 0

def main():
    import sys
    data = list(map(int, sys.stdin.read().strip().split()))
    n = data[0]
    height = data[1:n+1]
    result = trap(height)
    print(result)

main()`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

int trap(vector<int>& height) {
    // Write solution here
    return 0;
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    int n;
    cin >> n;
    vector<int> height(n);
    for(int i=0;i<n;i++) cin>>height[i];
    
    cout << trap(height);
    return 0;
}`,
    },
  },

  {
    title: "Merge Intervals",
    slug: "merge-intervals",
    difficulty: "Medium",
    description:
      "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    exampleTests: [
      {
        input: "4\n1 3 2 6 8 10 15 18",
        output: "1 6 8 10 15 18",
        explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]",
      },
      {
        input: "2\n1 4 4 5",
        output: "1 5",
      },
    ],
    starterCode: {
      javascript: `function merge(intervals) {
  // Write solution here
  return [];
}

function main(){
  const fs = require('fs');
  const input = fs.readFileSync(0,'utf8').trim().split(/\\s+/).map(Number);
  const n = input[0];
  const intervals = [];
  for(let i=1; i<input.length; i+=2) {
    intervals.push([input[i], input[i+1]]);
  }
  const result = merge(intervals);
  if(result.length === 0) {
    console.log("");
  } else {
    const flat = result.flat().join(" ");
    console.log(flat);
  }
}

main();`,
      python: `def merge(intervals):
    # Write solution here
    return []

def main():
    import sys
    data = list(map(int, sys.stdin.read().strip().split()))
    n = data[0]
    intervals = []
    for i in range(1, len(data), 2):
        intervals.append([data[i], data[i+1]])
    result = merge(intervals)
    if not result:
        print("")
    else:
        flat = [str(x) for sublist in result for x in sublist]
        print(" ".join(flat))

main()`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

vector<vector<int>> merge(vector<vector<int>>& intervals) {
    // Write solution here
    return {};
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    int n;
    cin >> n;
    vector<vector<int>> intervals;
    for(int i=0;i<n;i++) {
        int a, b;
        cin >> a >> b;
        intervals.push_back({a, b});
    }
    
    vector<vector<int>> result = merge(intervals);
    if(result.empty()) {
        cout << "";
    } else {
        for(auto& interval : result) {
            cout << interval[0] << " " << interval[1] << " ";
        }
    }
    return 0;
}`,
    },
  },

  {
    title: "Longest Palindromic Substring",
    slug: "longest-palindromic-substring",
    difficulty: "Medium",
    description:
      "Given a string s, return the longest palindromic substring in s.",
    exampleTests: [
      {
        input: "babad",
        output: "bab",
        explanation: "Note that 'aba' is also a valid answer",
      },
      {
        input: "cbbd",
        output: "bb",
      },
      {
        input: "a",
        output: "a",
      },
    ],
    starterCode: {
      javascript: `function longestPalindrome(s) {
  // Write solution here
  return "";
}

function main(){
  const fs = require('fs');
  const input = fs.readFileSync(0,'utf8').trim();
  const result = longestPalindrome(input);
  console.log(result);
}

main();`,
      python: `def longestPalindrome(s):
    # Write solution here
    return ""

def main():
    import sys
    s = sys.stdin.read().strip()
    result = longestPalindrome(s)
    print(result)

main()`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

string longestPalindrome(string s) {
    // Write solution here
    return "";
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    string s;
    cin >> s;
    cout << longestPalindrome(s);
    return 0;
}`,
    },
  },

  {
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    difficulty: "Easy",
    description:
      "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    exampleTests: [
      {
        input: "2",
        output: "2",
        explanation: "There are two ways: 1+1 or 2",
      },
      {
        input: "3",
        output: "3",
        explanation: "There are three ways: 1+1+1, 1+2, or 2+1",
      },
    ],
    starterCode: {
      javascript: `function climbStairs(n) {
  // Write solution here
  return 0;
}

function main(){
  const fs = require('fs');
  const input = parseInt(fs.readFileSync(0,'utf8').trim());
  const result = climbStairs(input);
  console.log(result);
}

main();`,
      python: `def climbStairs(n):
    # Write solution here
    return 0

def main():
    import sys
    n = int(sys.stdin.read().strip())
    result = climbStairs(n)
    print(result)

main()`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

int climbStairs(int n) {
    // Write solution here
    return 0;
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    int n;
    cin >> n;
    cout << climbStairs(n);
    return 0;
}`,
    },
  },

  {
    title: "Coin Change",
    slug: "coin-change",
    difficulty: "Medium",
    description:
      "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1. You may assume that you have an infinite number of each kind of coin.",
    exampleTests: [
      {
        input: "3\n1 2 5\n11",
        output: "3",
        explanation: "11 = 5 + 5 + 1",
      },
      {
        input: "2\n2\n3",
        output: "-1",
      },
      {
        input: "1\n1\n0",
        output: "0",
      },
    ],
    starterCode: {
      javascript: `function coinChange(coins, amount) {
  // Write solution here
  return -1;
}

function main(){
  const fs = require('fs');
  const input = fs.readFileSync(0,'utf8').trim().split(/\\s+/).map(Number);
  const n = input[0];
  const coins = input.slice(1, n+1);
  const amount = input[n+1];
  const result = coinChange(coins, amount);
  console.log(result);
}

main();`,
      python: `def coinChange(coins, amount):
    # Write solution here
    return -1

def main():
    import sys
    data = list(map(int, sys.stdin.read().strip().split()))
    n = data[0]
    coins = data[1:n+1]
    amount = data[n+1]
    result = coinChange(coins, amount)
    print(result)

main()`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

int coinChange(vector<int>& coins, int amount) {
    // Write solution here
    return -1;
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    int n;
    cin >> n;
    vector<int> coins(n);
    for(int i=0;i<n;i++) cin>>coins[i];
    int amount;
    cin >> amount;
    
    cout << coinChange(coins, amount);
    return 0;
}`,
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
