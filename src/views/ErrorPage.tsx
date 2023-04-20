import { createUseStyles } from 'react-jss';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import dohKerm from '../assets/doh_kerm.jpeg';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '30vw',
    margin: 'auto',
  },
});

export default function ErrorPage() {
  const classes = useStyles();
  const error = useRouteError();
  console.error(error);

  return (
    <div className={classes.container}>
      <h1>Oops!</h1>
      <p>
        <i>{(isRouteErrorResponse(error) && error.statusText) || (error instanceof Error && error.message)}</i>
      </p>
      <img src={dohKerm} />
    </div>
  );
}
