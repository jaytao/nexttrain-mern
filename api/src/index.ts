import express, { Express, Request, Response } from "express";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import request from "request";
import fetch from "node-fetch";

const app: Express = express();
const port = 3001;

interface Line {
  [key: string]: string;
}
interface Stop {
  [key: string]: {
    name: string;
    lines: Array<string>;
  };
}
interface TimeToArrival {
  line: string;
  mins: number;
}

const stops: Stop = {
  G21S: { name: "Queens Plaza", lines: ["E", "M", "R"] },
  D14N: { name: "7th Ave", lines: ["E"] },
  A28N: { name: "Penn Station", lines: ["E"] },
};

const lines: Line = {
  E: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace",
  M: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm",
  R: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw",
};

if (!process.env.MTA_API_KEY) {
  console.log("ERROR: MTA_API_KEY not set");
  process.exit(1);
}
const apiKey = process.env.MTA_API_KEY;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.get("/stop/:id", (req: Request<{ id: string }>, res: Response) => {
  const stopId = req.params.id;
  handleRequest(stopId).then((arr) => {
    console.log(arr);
    res.json(arr);
  });
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

async function handleRequest(stopId: string): Promise<TimeToArrival[]> {
  const arrivalTimes = await Promise.all(
    stops[stopId].lines.map((line) => {
      const url = lines[line];
      return queryMTA(url, stopId);
    })
  );
  return Promise.resolve(
    arrivalTimes.flatMap((arr) => arr).sort((a, b) => a.mins - b.mins)
  );
}

async function queryMTA(url: string, stopId: string): Promise<TimeToArrival[]> {
  const arrivalTimes: TimeToArrival[] = [];
  const now = new Date();

  const res = await fetch(url, {
    headers: {
      "x-api-key": apiKey,
    },
  });
  if (!res.ok) {
    console.log(`ERROR: ${res.body}`);
    process.exit(1);
  }
  const buffer = await res.arrayBuffer();
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
    new Uint8Array(buffer)
  );
  feed.entity.forEach((entity) => {
    if (
      entity.tripUpdate &&
      Object.keys(lines).includes(entity.tripUpdate.trip.routeId)
    ) {
      entity.tripUpdate.stopTimeUpdate
        .filter((update) => update.stopId === stopId)
        .forEach((update) => {
          if (update.stopId === stopId) {
            const time = new Date(Number(update.departure.time) * 1000);
            const diff = Math.trunc((time.getTime() - now.getTime()) / 60000);
            const arrivalTime: TimeToArrival = {
              line: entity.tripUpdate.trip.routeId,
              mins: diff,
            };
            //console.log(arrivalTime)
            arrivalTimes.push(arrivalTime);
          }
        });
    }
  });
  return arrivalTimes;
}
