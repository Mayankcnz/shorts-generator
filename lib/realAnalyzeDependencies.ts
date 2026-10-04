import { promisify } from "util";
import { generateClipSuggestions } from "./generateClipSuggestions";
import fs from "fs/promises";
import { execFile } from "child_process";
import { AnalyzeDependencies } from "./analyzeVideo";

const execFileAsync = promisify(execFile);

export const realAnalyzeDependencies: AnalyzeDependencies = {
  createDirectory: async (path) => {
    await fs.mkdir(path, {
      recursive: true,
    });
  },

  readTextFile: (path) => {
    return fs.readFile(path, "utf-8");
  },

  fileExists: async (path) => {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  },

  runCommand: async (command, arguments_) => {
    await execFileAsync(command, arguments_);
  },

  generateClips: generateClipSuggestions,
};
