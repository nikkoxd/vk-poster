import { Request, Response } from "express";
import { app } from "..";

app.post("/api/message", (req: Request, res: Response) => {
  console.log(req);
  res.send("Check the console");
});
