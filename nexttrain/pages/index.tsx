import React from "react";
import Grid from "@mui/material/Grid";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import SvgIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import Image from "next/image";
import TrainIcon from "@mui/icons-material/Train";
import TimeToArrival from "../components/time-to-arrival";

const HomePage: React.FC = () => {
  const stops = [
    { name: "Queens Plaza", id: "G21S" },
    { name: "7th Ave", id: "D14N" },
    { name: "Penn St", id: "A28N" },
  ];
  const [value, setValue] = React.useState(0);
  const [trainTimes, setTrainTimes] = React.useState<TimeToArrival[]>([]);

  const fetchData = async (stop: string) => {
    const res = await fetch(`/api/stop/${stop}`);
    const data: TimeToArrival[] = await res.json();
    setTrainTimes(data);
  };

  React.useEffect(() => {
    fetchData(stops[value].id);
  }, [value]);

  //fetchData(stops[value].id)
  return (
    <div>
      <BottomNavigation
        showLabels
        value={value}
        onChange={(_, newValue) => {
          setValue(newValue);
        }}
      >
        {stops.map((stop, idx) => (
          <BottomNavigationAction
            key={idx}
            label={stop.name}
            icon={<TrainIcon />}
          />
        ))}
      </BottomNavigation>
      <Grid container columnSpacing={3}>
        <Grid item xs={5}></Grid>
        <Grid item xs={2}>
          <Box
            sx={{ width: "100%", bgcolor: "background.paper" }}
            alignItems="center"
            justifyContent="center"
          >
            <List>
              {trainTimes.map((time, idx) => (
                <ListItem disablePadding key={idx}>
                  <Image
                    src={`/${time.line}-letter.svg`}
                    alt={time.line}
                    width="20"
                    height="20"
                    style={{"padding-right": "5px"} as React.CSSProperties }
                  />
                  <ListItemText primary={`${time.mins}`} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Grid>
        <Grid item xs={7}></Grid>
      </Grid>
    </div>
  );
};

export default HomePage;
