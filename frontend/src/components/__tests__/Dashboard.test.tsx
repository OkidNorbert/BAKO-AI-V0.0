import React from 'react'
import { render, screen } from '@testing-library/react'
import { Dashboard } from '../Dashboard'

describe('Dashboard', () => {
  it('renders the main heading', () => {
    render(<Dashboard />)
    expect(screen.getByText('Basketball Performance Dashboard')).toBeInTheDocument()
  })

  it('renders feature cards', () => {
    render(<Dashboard />)
    expect(screen.getByText('Video Analysis')).toBeInTheDocument()
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument()
    expect(screen.getByText('Training Recommendations')).toBeInTheDocument()
  })
})
