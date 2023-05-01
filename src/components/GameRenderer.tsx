import { useEffect, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { ResponsiveCanvas } from './ResponsiveCanvas';
import { GameAnnouncement } from '../types';
import { Team } from '../enums';
import { TEAM_COLOURS } from '../config';

const teamLogoStyles = {
  width: '30px',
  height: '30px',
  borderRadius: '3px',
};

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
  statusBar: {
    backgroundColor: 'black',
    margin: 'auto',
    width: '30vw',
    minWidth: '300px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    color: 'white',
    fontSize: '14pt',
    fontWeight: 'bold',
  },
  redTeamLogo: {
    ...teamLogoStyles,
    backgroundColor: TEAM_COLOURS[Team.Red],
  },
  blueTeamLogo: {
    ...teamLogoStyles,
    backgroundColor: TEAM_COLOURS[Team.Blue],
  },
  scores: {
    display: 'flex',
    alignItems: 'center',
  },
  scoreText: {
    margin: '0px 12px',
  },
  canvasContainer: {
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
  const [scoreText, setScoreText] = useState('0 - 0');

  useEffect(() => {
    if (!announcement) {
      return;
    }

    if (announcement.type === 'GOAL') {
      setAnnouncementMessage(`${Team[announcement.scoringTeam]} Team Scored!`);
      setAnnouncementMessageColour(TEAM_COLOURS[announcement.scoringTeam]);
      setScoreText(`${announcement.scores[Team.Red]} - ${announcement.scores[Team.Blue]}`);
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
    <>
      <div className={classes.statusBar}>
        <span className={classes.scores}>
          <div className={classes.redTeamLogo} />
          <span className={classes.scoreText}>{scoreText}</span>
          <div className={classes.blueTeamLogo} />
        </span>
        <span>00:00</span>
      </div>

      <div className={classes.canvasContainer}>
        {announcementMessage &&
          <div className={classes.announcer}>
            <h1 className={classes.announcementMessage}>{announcementMessage}</h1>
          </div>
        }
        <ResponsiveCanvas />
      </div>
    </>
  );
};
