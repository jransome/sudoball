import { PlayerInfo } from '../../types';
import { Team } from '../../enums';

type Props = {
  players: PlayerInfo[];
  onSelfTeamChange: (newTeam: Team) => void;
}

export const TeamChooser = ({ players, onSelfTeamChange }: Props) => {

  return (
    <div style={{ display: 'flex' }}>

      <div style={{ flex: 1 }}>
        <button id='join-red' onClick={() => onSelfTeamChange(Team.Red)}>Join Red Team</button>
        <ul>
          {players.filter(p => p.team === Team.Red).map(p => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      </div>

      <div style={{ flex: 1 }}>
        <h3>Unassigned</h3>
        <ul>
          {players.filter(p => p.team === Team.Unassigned).map(p => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      </div>

      <div style={{ flex: 1 }}>
        <button id='join-blue' onClick={() => onSelfTeamChange(Team.Blue)}>Join Blue Team</button>
        <ul>
          {players.filter(p => p.team === Team.Blue).map(p => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      </div>

    </div>
  );
};
