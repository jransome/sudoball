import { useEffect, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { ResponsiveCanvas } from './ResponsiveCanvas';

const useStyles = createUseStyles({
  announcementMessage: {
    color: 'gold',
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
  announcementMessage: string;
}

const GAME_ANNOUNCEMENT_DISPLAY_TIME_MS = 3000;

export const GameRenderer = ({ announcementMessage }: Props) => {
  const classes = useStyles();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    setAnnouncement(announcementMessage);
    setTimeout(() => setAnnouncement(''), GAME_ANNOUNCEMENT_DISPLAY_TIME_MS);
  }, [announcementMessage]);

  return (
    <div className={classes.container}>
      {announcement &&
        <div className={classes.announcer}>
          <h1 className={classes.announcementMessage}>{announcement}</h1>
        </div>
      }

      <ResponsiveCanvas />
    </div>
  );
};
