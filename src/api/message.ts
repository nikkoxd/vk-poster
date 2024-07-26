import { Request, Response } from "express";
import { app } from "..";

app.get("/api/message", (req: Request, res: Response) => {
  res.send("GET Request works");
});

app.post("/api/message", (req: Request, res: Response) => {
  console.log(req);
  res.send("Check the console");
});
