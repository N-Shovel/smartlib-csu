const PageLoader = () => {
  return (
    <div className="route-loader" role="status" aria-live="polite" aria-label="Loading page">
      <span className="route-loader__spinner" aria-hidden="true" />
      <p className="route-loader__label">Loading SmartLib...</p>
    </div>
  )
}

export default PageLoader 
