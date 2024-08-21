import * as fs from "fs";

// Function to read JSON from a file
function readJSONFile(filePath: string) {
  try {
    // Read the file synchronously
    const jsonData = fs.readFileSync(filePath, "utf-8");

    // Parse the JSON string into an object
    const data = JSON.parse(jsonData);

    return data;
  } catch (error) {
    console.error("Error reading or parsing the JSON file:", error);
    return null;
  }
}

type Data = {
  holder: string;
  QUO: string;
};
async function main() {
  // Specify the path to your JSON file
  const filePath = "bscQuollWMX.json";

  // Read and log the JSON data
  let jsonData: Data[] = readJSONFile(filePath);

  for (let i = 0; i < jsonData.length; i++) {
    jsonData[i].QUO = jsonData[i].QUO.toString() + "000000000000000000";
  }
  console.log("JSON Data:", jsonData);

  const outputFilePath = "bscQuollWMXRealDecimals.json";
  fs.writeFileSync(outputFilePath, JSON.stringify(jsonData, null, 2), "utf-8");
}

main();
