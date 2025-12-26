#!/usr/bin/env node
import yargs from "yargs";
import chalk from "chalk";
import { versionCheck } from "./implementations/utils/github-version";

// Display development warning
console.warn(chalk.yellow("\n⚠️  This CLI is for development work only. It is not recommended for production use."));
console.warn(chalk.yellow("For production, please integrate the TrustVC library.\n"));

yargs
  .scriptName("tradetrust")
  .commandDir("commands", { extensions: ["ts", "js"] })
  .middleware([versionCheck])
  .demandCommand()
  .strict()
  .help().argv;
