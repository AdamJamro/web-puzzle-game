importScripts('https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js');

let controller = null;
let id = 'undefined';
let taskCaption = 'undefined';

function sendMsg(message) {
    self.postMessage({
        workerId: id,
        taskCaption: taskCaption,
        ...message,
    });
}

self.onmessage = async function(e) {
    const cmd = e.data.command;
    // onUpdateCallback = e.data.onUpdateCallback;
    // onFinishCallback = e.data.onFinishCallback;

    if (cmd === 'start') {
        try {
            const url = e.data.url;
            id = e.data.id;
            taskCaption = e.data.taskCaption;
            await fetchAndDecompress(url);
        } catch (error) {
            sendMsg({
                type: 'error',
                message: error.message
            });
        }
    } else if (cmd === 'cancel') {
        if (controller) {
            controller.abort();
        }
    }
};

function calculateProgress(currentProgress, ratio, contribution) {
    return Math.min(currentProgress + Math.ceil(ratio * contribution), 100);
}

async function fetchAndDecompress(url) {
    try {
        // Create AbortController for cancellation support
        controller = new AbortController();
        const readerProgressPercentageContribution = 50;
        const decompressProgressPercentageContribution = 50;
        let progressSnapshot = 0;

        // Fetch the file
        sendMsg({ type: 'progress', status: 'fetching...', percent: 0 });
        const response = await fetch(url, { signal: controller.signal });

        // Get total size if available
        const totalSize = response.headers.get('content-length');
        let loaded = 0;

        // Get response as array buffer for binary processing
        const reader = response.body.getReader();
        const chunks = [];

        // Read the stream
        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                progressSnapshot = calculateProgress(progressSnapshot, 1, readerProgressPercentageContribution)
                sendMsg({
                    type: 'progress',
                    status: 'Decompressing...',
                    percent: progressSnapshot,
                });
                break;
            }

            chunks.push(value);
            loaded += value.length;

            // Report progress if we know the total size
            if (totalSize && Math.random() < 0.1) { // Randomly report progress to avoid overwhelming the UI
                sendMsg({
                    type: 'progress',
                    status: 'Reading...',
                    percent: calculateProgress(progressSnapshot, loaded / totalSize, readerProgressPercentageContribution),
                });

                // allow UI to update
                // setTimeout( () => {}, 5);
            }
        }

        // Combine chunks into a single array buffer
        const totalBytes = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const combinedBuffer = new Uint8Array(totalBytes);

        let position = 0;
        for (const chunk of chunks) {
            combinedBuffer.set(chunk, position);
            position += chunk.length;
        }

        // Decompress using pako
        console.log('Decompressing...' + id);
        const inflate = new pako.Inflate();
        let offset = 0;
        const chunkSize = 1024 * 1024;
        // const decompressedData = [];
        // inflate.onData = function(data) {
        //     decompressedData.push(data);
        // }
        while (offset < combinedBuffer.length) {
            const chunk = combinedBuffer.slice(offset, Math.min(offset + chunkSize, combinedBuffer.length)); // 1MB chunks
            inflate.push(chunk, false);
            offset += chunk.length;

            if (Math.random() < 0.1) { // Randomly report progress to avoid overwhelming the UI
                // Report progress
                sendMsg({
                    type: 'progress',
                    status: 'Decompressing...',
                    percent: calculateProgress(progressSnapshot, offset / combinedBuffer.length, decompressProgressPercentageContribution)
                    // percent: 100,
                });
            }

            // allow UI to update
            // setTimeout(() => {}, 5);

            if (inflate.err) {
                console.error('Decompression failed');
            }
        }
        // progressSnapshot = calculateProgress(progressSnapshot, 1, decompressProgressPercentageContribution)
        // sendMsg({ type: 'progress', percent: progressSnapshot, status: 'Collecting results...' });
        // Convert to intended format (assuming JSON in this example)
        // const textDecoder = new TextDecoder('utf-8');
        // const jsonString = textDecoder.decode(decompressed);
        // const jsonData = JSON.parse(jsonString);


        // TODO delete:
        // const result = new Uint8Array(decompressedData.reduce((sum, chunk) => sum + chunk.length, 0));
        // offset = 0;
        // for (const chunk of decompressedData) {
        //     result.set(chunk, offset);
        //     offset += chunk.length;
        //
        //     // Update progress
        //     sendMsg({
        //         type: 'progress',
        //         status: 'Collecting results...',
        //         percent: calculateProgress(progressSnapshot, offset / result.length, collectingResultsPercentageContribution)
        //     });
        //     // allow UI to update
        //     await new Promise(resolve => setTimeout(resolve, 0));
        // }

        // Return the result
        sendMsg({
            type: 'complete',
            percent: 100,
            result: inflate.result,
        });
        console.log('worker completed');
    } catch (error) {
        if (error.name === 'AbortError') {
            sendMsg({
                type: 'error',
                message: 'Operation cancelled'
            });
        } else {
            sendMsg({
                type: 'error',
                message: error.message
            });
        }
    }
}