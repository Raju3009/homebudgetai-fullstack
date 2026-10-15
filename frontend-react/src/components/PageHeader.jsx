export default function PageHeader({ eyebrow, title, description, actions, className = '' }) {
  return (
    <header className={('page-header ' + className).trim()}>
      <div className="page-header-copy">
        {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
