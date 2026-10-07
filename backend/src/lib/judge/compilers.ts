// ─── Cross-Platform Compiler & Runtime Discovery ─────────────────────────────
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export interface CompilerInfo {
  available: boolean;
  binPath: string;
  name: string;
  version?: string;
  installHint?: string;
}

const isWin = process.platform === "win32";

function canExecute(bin: string): boolean {
  try {
    execSync(`"${bin}" --version`, { stdio: "ignore", timeout: 2000 });
    return true;
  } catch {
    try {
      execSync(`"${bin}" -version`, { stdio: "ignore", timeout: 2000 });
      return true;
    } catch {
      try {
        execSync(`"${bin}" -V`, { stdio: "ignore", timeout: 2000 });
        return true;
      } catch {
        return false;
      }
    }
  }
}

export function getPythonBin(): CompilerInfo {
  if (process.env.PYTHON_BIN && fs.existsSync(process.env.PYTHON_BIN)) {
    return { available: true, binPath: process.env.PYTHON_BIN, name: "Python" };
  }

  // Common windows fallback paths
  const winPaths = [
    "C:\\Program Files\\PostgreSQL\\17\\pgAdmin 4\\python\\python.exe",
    "C:\\Program Files\\MySQL\\MySQL Workbench 8.0 CE\\python.exe",
    path.join(process.env.LOCALAPPDATA || "", "Programs\\Python\\Python312\\python.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Programs\\Python\\Python311\\python.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Programs\\Python\\Python310\\python.exe"),
  ];

  if (isWin) {
    for (const p of winPaths) {
      if (fs.existsSync(p)) {
        return { available: true, binPath: p, name: "Python 3" };
      }
    }
  }

  for (const cmd of ["python3", "python", "py"]) {
    if (canExecute(cmd)) {
      return { available: true, binPath: cmd, name: "Python 3" };
    }
  }

  return {
    available: false,
    binPath: isWin ? "python" : "/usr/bin/python3",
    name: "Python",
    installHint: isWin
      ? "Python is not in your Windows PATH. You can install it from python.org or the Microsoft Store."
      : "Install python3 (sudo apt install python3).",
  };
}

export function getJavaBin(): CompilerInfo {
  if (process.env.JAVA_BIN && fs.existsSync(process.env.JAVA_BIN)) {
    return { available: true, binPath: process.env.JAVA_BIN, name: "Java" };
  }

  const winOracle = "C:\\Program Files\\Common Files\\Oracle\\Java\\javapath\\java.exe";
  if (isWin && fs.existsSync(winOracle)) {
    return { available: true, binPath: winOracle, name: "Java 21" };
  }

  if (canExecute("java")) {
    return { available: true, binPath: "java", name: "Java" };
  }

  return {
    available: false,
    binPath: isWin ? "java" : "/usr/bin/java",
    name: "Java",
    installHint: isWin
      ? "Java JDK is not detected. Download OpenJDK from adoptium.net."
      : "Install default-jdk (sudo apt install default-jdk).",
  };
}

export function getCppBin(): CompilerInfo {
  if (process.env.GPP_BIN && fs.existsSync(process.env.GPP_BIN)) {
    return { available: true, binPath: process.env.GPP_BIN, name: "G++" };
  }

  for (const cmd of ["g++", "clang++"]) {
    if (canExecute(cmd)) {
      return { available: true, binPath: cmd, name: "C++ (g++)" };
    }
  }

  return {
    available: false,
    binPath: isWin ? "g++" : "/usr/bin/g++",
    name: "C++ (g++)",
    installHint: isWin
      ? "G++ (MinGW) is not detected in PATH. You can run solutions in JavaScript (built-in) or install MinGW-w64."
      : "Install g++ (sudo apt install g++).",
  };
}
