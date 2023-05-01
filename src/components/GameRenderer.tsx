import { useEffect, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { ResponsiveCanvas } from './ResponsiveCanvas';
import { GameAnnouncement } from '../types';
import { Team } from '../enums';
import { TEAM_COLOURS } from '../config';

const useStyles = createUseStyles({
  announcementMessage: {
    color: 'white',
    backgroundColor: (props: { announcementMessageColour: string; }) => props.announcementMessageColour,
  },
  announcer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  canvas: {
    display: 'block',
    margin: 'auto',
  },
  container: {
    position: 'relative',
  },
});

type Props = {
  announcement?: GameAnnouncement;
}

export const GameRenderer = ({ announcement }: Props) => {
  const [announcementMessageColour, setAnnouncementMessageColour] = useState('black');
  const classes = useStyles({ announcementMessageColour });
  const [announcementMessage, setAnnouncementMessage] = useState('');

  useEffect(() => {
    if (!announcement) {
      return;
    }

    if (announcement.type === 'GOAL') {
      setAnnouncementMessage(`${Team[announcement.scoringTeam]} Team Scored!`);
      setAnnouncementMessageColour(TEAM_COLOURS[announcement.scoringTeam]);
      return;
    }

    if (announcement.type === 'FINISH') {
      setAnnouncementMessage(`${Team[announcement.winningTeam]} Team Wins!`);
      return;
    }

    if (announcement.type === 'KICKOFF') {
      const updateCountdown = (secondsLeft: number) => {
        if (secondsLeft === 0) {
          setAnnouncementMessage('');
          return;
        }

        setAnnouncementMessage(String(secondsLeft));
        setTimeout(() => updateCountdown(secondsLeft - 1), 1000);
      };
      updateCountdown(announcement.countdownSeconds);
      return;
    }
  }, [announcement]);

  return (
    <div className={classes.container}>
      {announcementMessage &&
        <div className={classes.announcer}>
          <h1 className={classes.announcementMessage}>{announcementMessage}</h1>
        </div>
      }

      <ResponsiveCanvas />
    </div>
  );
};
