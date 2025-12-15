import { render, screen } from '@testing-library/react'
import { LessonCard } from '../lesson-card'

/**
 * LessonCard Component Tests
 */

describe('LessonCard', () => {
  const mockLesson = {
    id: 1,
    level: 1,
    title: 'HSK 1 - Greetings',
    description: 'Learn basic greetings',
    characterCount: 10,
    vocabularyCount: 15,
    isUnlocked: true,
    isCompleted: false,
  }

  it('renders lesson information', () => {
    render(<LessonCard lesson={mockLesson} />)

    expect(screen.getByText('HSK 1 - Greetings')).toBeInTheDocument()
    expect(screen.getByText(/Learn basic greetings/i)).toBeInTheDocument()
    expect(screen.getByText(/10/)).toBeInTheDocument() // characters
    expect(screen.getByText(/15/)).toBeInTheDocument() // vocabulary
  })

  it('shows locked state', () => {
    const lockedLesson = { ...mockLesson, isUnlocked: false }

    render(<LessonCard lesson={lockedLesson} />)

    expect(screen.getByText(/locked/i)).toBeInTheDocument()
  })

  it('shows completed state', () => {
    const completedLesson = { ...mockLesson, isCompleted: true }

    render(<LessonCard lesson={completedLesson} />)

    expect(screen.getByText(/completed/i)).toBeInTheDocument()
  })

  it('is clickable when unlocked', () => {
    render(<LessonCard lesson={mockLesson} />)

    const card = screen.getByRole('link')
    expect(card).toHaveAttribute('href', '/lessons/1')
  })

  it('is not clickable when locked', () => {
    const lockedLesson = { ...mockLesson, isUnlocked: false }

    render(<LessonCard lesson={lockedLesson} />)

    const card = screen.queryByRole('link')
    expect(card).not.toBeInTheDocument()
  })
})
