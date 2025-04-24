// import * as tf from "@tensorflow/tfjs";


export const IMGLoader = {
    urls: {
        images: 'https://raw.githubusercontent.com/AdamJamro/AdamJamro/master/train-images-idx3-ubyte.gz',
        labels: 'https://raw.githubusercontent.com/AdamJamro/AdamJamro/master/train-labels-idx1-ubyte.gz',
        decompressWorker: 'image_loader/workers/decompress-worker.js'
    },
    config: {
        itemsPerLoad: 20,
        observerThreshold: 0.15, // more than zero for client to see the animation
        observerMargin: '100px'
    },
    state: {
        loadedCount: 0,
        currentFilter: 'all',
        loading: false,
        allDigitsLoaded: false,
        MNISTData: null,
        rawImages: null,
        rawLabels: null
    },
    elements: {
        container: document.getElementById('digits-container'),
        loadMoreBtn: document.getElementById('load-more-btn'),
        loader: document.getElementById('loader'),
        statusText: document.getElementById('loader-status'),
        digitButtons: document.querySelectorAll('.digit-btn'),
        errorText: document.getElementById('loader-error-text'),
        progressBarsContainer: document.getElementById('loader-progress-bars-container')
    },

    init() {
        this.elements.loadMoreBtn.addEventListener('click', () => this.loadMoreDigits());
        this.elements.digitButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.filterDigits(e.target.dataset.digit));
        });

        this.setupIntersectionObserver();
        // this.loadMoreDigits();
    },

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: this.config.observerMargin,
            threshold: this.config.observerThreshold
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const currentFilter = this.state.currentFilter;
                    // Skip if filtered and not matching filter
                    if (currentFilter !== 'all' && entry.target.dataset.digit.toString() !== currentFilter) {
                        return;
                    }

                    const img = entry.target.querySelector('.digit-img');
                    if (img && img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        entry.target.classList.add('visible');
                        this.observer.unobserve(entry.target);
                    }
                }
            });
        }, options);
    },

    renderDigits() {
        return new Promise((resolve) => {
            if (!this.state.MNISTData) return;

            const digits = [];
            const startIdx = this.state.loadedCount;
            const endIdx = Math.min(startIdx + this.config.itemsPerLoad, this.config.totalDigits);
            const {
                // tensor,
                images,
                labels,
                imageWidth,
                imageHeight,
            } = this.state.MNISTData;
            const pixelsPerImage = imageWidth * imageHeight;

            for (let i = startIdx; i < endIdx; i++) {
                const imageIndex = i * pixelsPerImage;
                const digitData = images.slice(imageIndex, imageIndex + pixelsPerImage);

                const digit = +labels[i];
                const _img_url = this.renderDigit(digitData, imageWidth, imageHeight);
                digits.push({
                    id: i,
                    digit: digit,
                    imageSrc: _img_url,
                    label: `Digit ${digit}`
                }); // digit formatting
            }

            resolve(digits);
        });
    },

    loadMoreDigits() {
        if (this.state.loading || this.state.allDigitsLoaded) return;
        this.elements.errorText.classList.remove('visible');

        if (!this.state.MNISTData) {
            this.fetchAndDecompressInBackground(this.urls.images, this.urls.labels);

            // this.fetchRawMNIST()
            //     .then(rawData => {
            //         this.setState({rawMNIST: rawData});
            //         this.loadMoreDigits();
            //     })
            //     .catch(error => {
            //         console.error('Error fetching MNIST data:', error);
            //         this.elements.errorText.textContent = 'Error loading MNIST data. Please check your network and try again later.';
            //         this.elements.errorText.classList.add('visible');
            //     });
            return;
        }

        this.setState({loading: true}); // set loading to prevent multiple loads
        this.elements.loader.classList.add('active');

        this.renderDigits()
            .then(digits => {
                this.renderDigitsCards(digits);
                const newCount = this.state.loadedCount + digits.length;
                const allLoaded = newCount >= this.config.totalDigits;

                this.setState({
                    loadedCount: newCount,
                    loading: false,
                    allDigitsLoaded: allLoaded
                });

                this.elements.statusText.textContent = `Loaded ${newCount} images`;
                this.elements.loader.classList.remove('active');

                if (allLoaded) {
                    this.elements.loadMoreBtn.disabled = true;
                    this.elements.loadMoreBtn.textContent = 'All Images Loaded';
                }
            })
            .catch(error => {
                console.error('Error loading digits:', error);
                this.setState({loading: false});
                this.elements.loader.classList.remove('active');
            });
    },

    renderDigit(digitData, width = 28, height = 28) {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Create an ImageData object
        const imageData = ctx.createImageData(width, height);

        // Fill the imageData with our digit data
        for (let i = 0; i < digitData.length; i++) {
            const value = digitData[i];
            // Set RGB to the same value (grayscale) and Alpha to 255 (fully opaque)
            imageData.data[i * 4] = value;     // R
            imageData.data[i * 4 + 1] = value; // G
            imageData.data[i * 4 + 2] = value; // B
            imageData.data[i * 4 + 3] = 255;   // A
        }

        // Put the image data onto the canvas
        ctx.putImageData(imageData, 0, 0);

        // Create an Image object and set its source to the canvas data
        // const image = new Image();
        // image.src = canvas.toDataURL();
        return canvas.toDataURL();

    },

    renderDigitsCards(formattedDigitsChunk) {
        // see format digits in renderDigits
        formattedDigitsChunk.forEach(formattedDigit => {
            const itemEl = document.createElement('div');
            itemEl.className = 'digit-item';
            itemEl.dataset.digit = formattedDigit.digit;

            const imgEl = document.createElement('img');
            imgEl.className = 'digit-img';
            imgEl.alt = `Handwritten digit ${formattedDigit.digit}`;
            imgEl.dataset.src = formattedDigit.imageSrc; // Store src in data attribute for lazy loading

            const labelEl = document.createElement('div');
            labelEl.className = 'digit-label';
            labelEl.textContent = formattedDigit.label;

            itemEl.appendChild(imgEl);
            itemEl.appendChild(labelEl);
            this.elements.container.appendChild(itemEl);

            this.filterDigits(this.state.currentFilter); // Filter immediately after rendering
            // Observe for lazy loading
            this.observer.observe(itemEl);
        });
    },

    filterDigits(digit) {
        // Update active button
        this.elements.digitButtons.forEach(btn => {
            if (btn.dataset.digit === digit) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        this.setState({ currentFilter: digit });

        // Filter visible elements
        const items = this.elements.container.querySelectorAll('.digit-item');
        items.forEach(item => {
            if (digit === 'all' || item.dataset.digit === digit) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },

    setState(newState) {
        this.state = { ...this.state, ...newState };
    },

    processDecompressedData(imageData, labelData) {
        // Parse image header information (IDX format)
        const imageMagic = imageData[0] << 24 | imageData[1] << 16 | imageData[2] << 8 | imageData[3];
        const numImages = imageData[4] << 24 | imageData[5] << 16 | imageData[6] << 8 | imageData[7];
        const numRows = imageData[8] << 24 | imageData[9] << 16 | imageData[10] << 8 | imageData[11];
        const numCols = imageData[12] << 24 | imageData[13] << 16 | imageData[14] << 8 | imageData[15];

        this.config.totalDigits = numImages;

        // Extract actual image data (starting from byte 16)
        const images = imageData.slice(16);

        // Parse label header information
        const labelMagic = labelData[0] << 24 | labelData[1] << 16 | labelData[2] << 8 | labelData[3];
        const numLabels = labelData[4] << 24 | labelData[5] << 16 | labelData[6] << 8 | labelData[7];

        // Extract actual label data (starting from byte 8)
        const labels = labelData.slice(8);

        console.log(`Found ${numImages} images with dimensions ${numRows}x${numCols}`);
        console.log(`Found ${numLabels} labels`);

        // Using tensor would be more convenient but for our use case it is too heavy
        // Using the actual dimensions from the file
        // const tensor = tf.tensor4d(
        //     Array.from(images),
        //     [numImages, numRows, numCols, 1],
        //     'float32'
        // );


        this.state.MNISTData = {
            // tensor,
            images,
            labels,
            numImages,
            imageWidth: numCols,
            imageHeight: numRows
        };
    },

    fetchAndDecompressInBackground(imagesUrl, labelsUrl) {
        const imagesWorker = new Worker(this.urls.decompressWorker);
        const labelsWorker = new Worker(this.urls.decompressWorker);
        let imagesData, labelsData = null;


        const imagesWorkerMutex = { status: true };
        const labelsWorkerMutex = { status: true };

        const WorkerOnMessageCallback = function(id, e, mutex) {
            if (e.data.type === 'progress') {
                // if (mutex.status) {
                //     mutex.status = false;
                //     this.updateProgressBar(e.data);
                //     mutex.status = true;
                // }
                this.updateProgressBar(e.data);
            } else if (e.data.type === 'complete') {
                this.finishProgressBar(e.data.workerId);
                if (id === 'imgWkr') {
                    imagesData = e.data.result;
                }
                if (id === 'lblWkr') {
                    labelsData = e.data.result;
                }
                if (imagesData && labelsData) {
                    this.processDecompressedData(imagesData, labelsData);
                    this.loadMoreDigits();
                }
            } else if (e.data.type === 'error') {
                console.error('Worker error:', e.data.message);
            }
        }.bind(this);

        // Set up message handler to receive results
        imagesWorker.onmessage = (e) => WorkerOnMessageCallback('imgWkr', e, imagesWorkerMutex);
        labelsWorker.onmessage = (e) => WorkerOnMessageCallback('lblWkr', e, labelsWorkerMutex);

        // Start the worker with the URL to fetch
        labelsWorker.postMessage({
            command: 'start',
            id: 'lblWkr',
            taskCaption: 'Labels',
            url: labelsUrl,
            // onUpdateCallback: this.updateProgressBar.bind(this), CANNOT COPY NATIVE CODE!
            // onFinishCallback: this.finishProgressBar.bind(this),
        });
        imagesWorker.postMessage({
            command: 'start',
            id: 'imgWkr',
            taskCaption: 'Images',
            url: imagesUrl,
            // onUpdateCallback: this.updateProgressBar.bind(this),
            // onFinishCallback: this.finishProgressBar.bind(this),
        });

        return {
            cancel: function() {
                imagesWorker.postMessage({ command: 'cancel' });
                labelsWorker.postMessage({ command: 'cancel' });
                imagesWorker.terminate();
                labelsWorker.terminate();
            }
        };
    },

    updateProgressBar(data) {
        const percent = data.percent;
        const workerId = data.workerId;
        const taskCaption = data.taskCaption;
        const status = data.status;

        const bar = document.getElementById(`progress-bar-${workerId}`);
        this.elements.progressBarsContainer.classList.add('loading');
        if (bar) {
            console.log('Worker progress:', percent);
            bar.style.width = `${percent}%`;
            console.log('Worker width:', bar.style.width);
            bar.setAttribute('style', `width: ${percent}% !important`);
            bar.textContent = `${taskCaption}: ${percent}% ${status}`;
        } else {
            const progressBar = document.createElement('div');
            progressBar.id = `progress-bar-${workerId}`;
            progressBar.className = 'progress-bar';
            progressBar.style.width = `${percent}%`;
            progressBar.textContent = `${percent}%`;
            const parent = this.elements.progressBarsContainer;

            parent.appendChild(progressBar);
        }
    },
    finishProgressBar(workerId) {
        const bar = this.elements.progressBarsContainer.querySelector(`#progress-bar-${workerId}`);
        bar.classList.remove('loading');
        bar.style.width = '100%';
        bar.textContent = 'Completed';
        console.log('Worker finished:', workerId);
        bar.classList.add('completed');
        console.log("DEBUG: Finished progress bar for worker:", workerId);
        setTimeout(() => {
            bar.remove();
        }, 1500);
    },

    // TODO delete:
    // fetchRawMNIST() {
    //     return Promise.all([
    //         fetch(this.urls.images),
    //         fetch(this.urls.labels)
    //     ])
    //     .then(([imagesResponse, labelsResponse]) => {
    //         if (!imagesResponse.ok || !labelsResponse.ok) {
    //             throw new Error('Failed to fetch MNIST data');
    //         }
    //         return Promise.all([
    //             imagesResponse.arrayBuffer(),
    //             labelsResponse.arrayBuffer()
    //         ]);
    //     })
    //     .then(([imagesBuffer, labelsBuffer]) => {
    //         // Process binary data
    //         const compressedImageData = new Uint8Array(imagesBuffer);
    //         const compressedLabelData = new Uint8Array(labelsBuffer);
    //
    //         const imageData = pako.ungzip(compressedImageData);
    //         const labelData = pako.ungzip(compressedLabelData);
    //
    //         // Parse image header information (IDX format)
    //         const imageMagic = imageData[0] << 24 | imageData[1] << 16 | imageData[2] << 8 | imageData[3];
    //         const numImages = imageData[4] << 24 | imageData[5] << 16 | imageData[6] << 8 | imageData[7];
    //         const numRows = imageData[8] << 24 | imageData[9] << 16 | imageData[10] << 8 | imageData[11];
    //         const numCols = imageData[12] << 24 | imageData[13] << 16 | imageData[14] << 8 | imageData[15];
    //
    //         this.config.totalDigits = numImages;
    //
    //         // Extract actual image data (starting from byte 16)
    //         const images = imageData.slice(16);
    //
    //         // Parse label header information
    //         const labelMagic = labelData[0] << 24 | labelData[1] << 16 | labelData[2] << 8 | labelData[3];
    //         const numLabels = labelData[4] << 24 | labelData[5] << 16 | labelData[6] << 8 | labelData[7];
    //
    //         // Extract actual label data (starting from byte 8)
    //         const labels = labelData.slice(8);
    //
    //         console.log(`Found ${numImages} images with dimensions ${numRows}x${numCols}`);
    //         console.log(`Found ${numLabels} labels`);
    //
    //         // Using the actual dimensions from the file
    //         const tensor = tf.tensor4d(
    //             Array.from(images),
    //             [numImages, numRows, numCols, 1],
    //             'float32'
    //         );
    //
    //         return {
    //             tensor,
    //             images,
    //             labels,
    //             numImages,
    //             imageWidth: numCols,
    //             imageHeight: numRows
    //         };
    //     })
    //     .catch(error => {
    //         console.error('Error fetching MNIST data:', error);
    //         throw error;
    //     });
    // },

    // TODO delete
    // displayMNISTSamples(numSamples = 10) {
    //     const container = document.createElement('div');
    //     document.body.appendChild(container);
    //
    //     this.fetchRawMNIST().then(({ images, labels, imageWidth, imageHeight }) => {
    //         const pixelsPerImage = imageWidth * imageHeight;
    //
    //         for (let i = 0; i < numSamples; i++) {
    //             const startIdx = i * pixelsPerImage;
    //             const digitData = images.slice(startIdx, startIdx + pixelsPerImage);
    //             const label = labels[i];
    //
    //             const image = this.renderDigit(digitData, imageWidth, imageHeight);
    //
    //             // Create a wrapper div for each digit with its label
    //             const wrapper = document.createElement('div');
    //             wrapper.style.display = 'inline-block';
    //             wrapper.style.margin = '10px';
    //             wrapper.style.textAlign = 'center';
    //
    //             // Add the label
    //             const labelElement = document.createElement('div');
    //             labelElement.textContent = `Label: ${label}`;
    //
    //             // Add the image
    //             wrapper.appendChild(image);
    //             wrapper.appendChild(labelElement);
    //
    //             container.appendChild(wrapper);
    //         }
    //     })
    //     .catch(error => {
    //         console.error('Error displaying MNIST samples:', error);
    //     });
    // },

};