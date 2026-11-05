import { useId } from 'react';
import { ArrowUpRight, Download, Github, Play } from 'lucide-react';
import { projectActions, type Project } from '../data/portfolio';

export function ProjectActions({ project, context = 'detail' }: { project: Project; context?: 'card' | 'detail' }) {
  const actions = projectActions(project);
  const descriptionId = useId();
  const beta = actions.find(action => action.kind === 'beta');
  const missing = actions.find(action => action.missingMessage);
  return <div className="project-action-area" role="group" aria-label={`${project.name} actions`}>
    <div className="actions project-actions">
      {actions.map(action => {
        const Icon = action.kind === 'github' ? Github : action.kind === 'download' ? Download : action.kind === 'live' ? Play : ArrowUpRight;
        const content = <><Icon size={16} aria-hidden="true"/>{action.label}</>;
        const className = `button ${action.primary && !(action.kind === 'beta' && context === 'card') ? 'primary' : 'secondary'}`;
        return action.href ? <a key={action.kind} href={action.href} className={className}
          target="_blank" rel="noopener noreferrer" aria-describedby={action.kind === 'beta' ? descriptionId : undefined}>{content}</a>
          : <button key={action.kind} type="button" className={className} disabled
            aria-describedby={descriptionId}>{content}</button>;
      })}
    </div>
    {beta && <p className="action-config-note" id={descriptionId}>Available through Apple TestFlight</p>}
    {missing && <p className="action-config-note" id={descriptionId}>{missing.missingMessage}</p>}
    {!actions.length && <p className="action-config-note">No public project links configured yet.</p>}
  </div>;
}
