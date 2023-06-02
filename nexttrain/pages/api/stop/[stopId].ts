import { NextApiRequest, NextApiResponse } from "next";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import fetch from "node-fetch";
import TimeToArrival from "../../../components/time-to-arrival";

// @ts-ignore: Object is possibly 'null'.

interface Line {
  [key: string]: string;
}
interface Stop {
  [key: string]: {
    name: string;
    lines: Array<string>;
  };
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

async function handleRequest(
  stopId: string,
  apiKey: string
): Promise<TimeToArrival[]> {
  const arrivalTimes = await Promise.all(
    stops[stopId].lines.map((line) => {
      const url = lines[line];
      return queryMTA(url, stopId, apiKey);
    })
  );
  return Promise.resolve(
    arrivalTimes.flatMap((arr) => arr).sort((a, b) => a.mins - b.mins)
  );
}

async function queryMTA(
  url: string,
  stopId: string,
  apiKey: string
): Promise<TimeToArrival[]> {
  const arrivalTimes: TimeToArrival[] = [];
  const now = new Date();

  const res = await fetch(url, {
    headers: {
      "x-api-key": apiKey,
    },
  });
  if (!res.ok) {
    console.log(`ERROR: ${JSON.stringify(res.body)}`);
    process.exit(1);
  }
  const buffer = await res.arrayBuffer();
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
    new Uint8Array(buffer)
  );
  feed.entity.forEach((entity) => {
    if (
      entity.tripUpdate &&
      Object.keys(lines).includes(entity.tripUpdate.trip.routeId!)
    ) {
      entity.tripUpdate
        .stopTimeUpdate!.filter((update) => update.stopId === stopId)
        .forEach((update) => {
          if (update.stopId === stopId) {
            const time = new Date(Number(update.departure!.time) * 1000);
            const diff = Math.trunc((time.getTime() - now.getTime()) / 60000);
            const arrivalTime: TimeToArrival = {
              line: entity.tripUpdate!.trip.routeId!,
              mins: diff,
            };
            arrivalTimes.push(arrivalTime);
          }
        });
    }
  });
  return arrivalTimes;
}
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const query = req.query;
  const { stopId } = query;
  const apiKey = process.env.MTA_API_KEY;

  if (apiKey == null) {
    res.status(500).json({error: "MTA_API_KEY not found"})
    return
  }
  handleRequest(stopId as string, apiKey!)
    .then((arr) => {
      res.status(200).json(arr);
    })
    .catch((error) => {
      res.status(500).json({ error: error });
    });
}
