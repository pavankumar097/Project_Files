import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { read, utils } from "xlsx";

export async function GET(request: NextRequest) {
  try {
    // Log the current working directory
    console.log("Current working directory:", process.cwd());

    // Construct the absolute path to the Excel file
    const filePath = path.join(process.cwd(), "public", "ipl-teams.xlsx");
    console.log("Reading Excel file from:", filePath);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at ${filePath}`);
    }

    // Check file permissions
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      console.log("File is readable");
    } catch (err) {
      throw new Error(`File is not readable: ${err.message}`);
    }

    // Read the file as a buffer
    const fileBuffer = fs.readFileSync(filePath);
    console.log("File buffer read successfully");

    // Read the Excel workbook from the buffer
    const workbook = read(fileBuffer, { type: "buffer" });
    console.log("Workbook read successfully");

    // Convert each sheet to JSON
    const allTeams = workbook.SheetNames.map((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = utils.sheet_to_json(worksheet);
      const players = jsonData.map((row: any, index: number) => ({
        id: index + 1,
        name: row["Player"] || "",
        span: row["Span"] || "",
        position: row["Position"] || "",
        role: row["Type"] || "",
        consistency: row["Consistency"] || "",
        form: row["Form"] || "",
        team: row["Team"] || sheetName,
        nationality: row["Nationality"] || "",
        bowlerType: row["Bowler_Type"] || "",
        allRounderType: row["AR Type"] || "",
      }));
      return {
        id: sheetName, // e.g., "SRH", "RCB", "CSK"
        name: sheetName,
        players,
      };
    });

    return NextResponse.json(allTeams);
  } catch (error) {
    console.error("Error reading Excel file:", error);
    return NextResponse.json(
      { error: "Failed to read Excel file", details: String(error) },
      { status: 500 }
    );
  }
}