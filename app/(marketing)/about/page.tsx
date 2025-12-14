export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-4xl font-bold">About Mandarin SRS</h1>
        <p className="text-lg text-muted-foreground">
          Mandarin SRS is a spaced repetition learning platform focused on helping you master
          Chinese characters through pinyin typing practice.
        </p>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">How It Works</h2>
          <p>
            Our platform uses the proven spaced repetition algorithm to help you learn Chinese
            characters efficiently. You&apos;ll see a character, type the correct pinyin with tone
            marks, and get immediate feedback.
          </p>
        </div>
      </div>
    </div>
  )
}
