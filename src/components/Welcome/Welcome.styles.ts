import { createUseStyles } from 'react-jss';

export const useStyles = createUseStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'fixed',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to right top, #11108e, #10119d, #1011ad, #0e12bc, #0d12cc, #3f0ed3, #5b08d9, #7200df, #9700dc, #b400d9, #ce00d6, #e518d3)',
  },
  content: {
    minWidth: '300px',
    borderRadius: '4px',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
  },
  controls: {
    height: '150px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  nameInput: {
    paddingTop: '10px',
    fontFamily: 'Bruno Ace',
    textAlign: 'center',
    fontSize: '20px',
    background: 'transparent',
    color: 'coral',
    border: 'none',
    '&:focus': {
      outline: 'none',
    },
  },
  title:{
    color: 'white',
    textAlign: 'center',
  },
  createOrJoinGameButton: {
    borderStyle: 'solid',
    borderColor: 'coral',
    color: 'white',
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: '#38EFEF',
      color: 'coral',
    },
  },
});
