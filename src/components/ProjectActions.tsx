import { useId } from 'react';
import { ArrowUpRight, Download, Github, Play } from 'lucide-react';
import { projectActions, type Project } from '../data/portfolio';

export function ProjectActions({ project }: { project: Project }) {
  const actions = projectActions(project);
  const descriptionId = useId();
  const missing = actions.find(action => action.missingMessage);
  return <div className="project-action-area" role="group" aria-label={`${project.name} actions`}>
    <div className="actions project-actions">
      {actions.map(action => {
        const Icon = action.kind === 'github' ? Github : action.kind === 'download' ? Download : action.kind === 'live' ? Play : ArrowUpRight;
        const content = <><Icon size={16} aria-hidden="true"/>{action.label}</>;
        const className = `button ${action.primary ? 'primary' : 'secondary'}`;
        return action.href ? <a key={action.kind} href={action.href} className={className}
          target="_blank" rel="noopener noreferrer">{content}</a>
          : <button key={action.kind} type="button" className={className} disabled
            aria-describedby={descriptionId}>{content}</button>;
      })}
    </div>
    {missing && <p className="action-config-note" id={descriptionId}>{missing.missingMessage}</p>}
    {!actions.length && <p className="action-config-note">No public project links configured yet.</p>}
  </div>;
}
