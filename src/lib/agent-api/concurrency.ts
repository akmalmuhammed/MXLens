/** Runs `worker` over `items` with at most `concurrency` in flight, preserving order. */
export async function mapWithConcurrency<T, TResult>(
    items: T[],
    concurrency: number,
    worker: (item: T, index: number) => Promise<TResult>
) {
    let index = 0;
    const results = new Array<TResult>(items.length);

    async function next() {
        while (index < items.length) {
            const currentIndex = index++;
            results[currentIndex] = await worker(items[currentIndex], currentIndex);
        }
    }

    await Promise.all(
        Array.from({ length: Math.min(concurrency, items.length) }, () => next())
    );

    return results;
}
