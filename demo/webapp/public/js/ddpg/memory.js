
class Memory {

    /**
     * @param maxlen (number) Buffer limit
     */
    constructor(maxlen){
        this.maxlen = maxlen;
        this.buffer = [];
        this.priorBuffer = [];
    }

    /**
     * Sample a batch
     * @param batchSize (number)
     * @return batch []
     */
    getBatch(batchSize){
        const batch =  {
            'obs0': [],
            'obs1': [],
            'rewards': [],
            'actions': [],
            'terminals': [],
        };

        if (batchSize > this.priorBuffer.length){
            console.warn("The size of the replay buffer is < to the batchSize. Return empty batch.");
            return batch;
        }

        for (let b=0; b < batchSize/2; b++){
            let id = Math.floor(Math.random() * this.priorBuffer.length);
            batch.obs0.push(this.priorBuffer[id].obs0);
            batch.obs1.push(this.priorBuffer[id].obs1);
            batch.rewards.push(this.priorBuffer[id].reward);
            batch.actions.push(this.priorBuffer[id].action);
            batch.terminals.push(this.priorBuffer[id].terminal);
        }
        return batch
    }

    _bufferBatch(batchSize){
        const batch =  {
            'obs0': [],
            'obs1': [],
            'rewards': [],
            'actions': [],
            'terminals': [],
        };

        for (let b=0; b < batchSize/2; b++){
            let nElem = this.buffer.pop();
            batch.obs0.push(nElem.obs0);
            batch.obs1.push(nElem.obs1);
            batch.rewards.push(nElem.reward);
            batch.actions.push(nElem.action);
            batch.terminals.push(nElem.terminal);
        }

        for (let b=0; b < batchSize/2; b++){
            let id = Math.floor(Math.random() * this.buffer.length);
            batch.obs0.push(this.buffer[id].obs0);
            batch.obs1.push(this.buffer[id].obs1);
            batch.rewards.push(this.buffer[id].reward);
            batch.actions.push(this.buffer[id].action);
            batch.terminals.push(this.buffer[id].terminal);
            this.buffer.splice(id, 1);
        }

        return batch
    }

    _addRandomBufferBatch(batchSize, batch){
        for (let b=0; b < batchSize; b++){
            let id = Math.floor(Math.random() * this.buffer.length);
            batch.obs0.push(this.buffer[id].obs0);
            batch.obs1.push(this.buffer[id].obs1);
            batch.rewards.push(this.buffer[id].reward);
            batch.actions.push(this.buffer[id].action);
            batch.terminals.push(this.buffer[id].terminal);
            this.buffer.splice(id, 1);
        }
        return batch
    }

    /**
     * Sample a batch
     * @param batchSize (number)
     * @return batch []
     */
    popBatch(batchSize){
        let originalBatchSize = batchSize;
        let priorBufferBatchSize;
        let bufferBatchSize;
        if (batchSize % 2 != 0){
            console.warn("Batch size should be a even.")
        }
        if (this.priorBuffer.length < batchSize/2){
            //console.log("get full batch from buffer");
            const batch = this._bufferBatch(batchSize);
            console.assert(batch.obs0.length == batchSize);
            return batch;
        }
        const batch =  {
            'obs0': [],
            'obs1': [],
            'rewards': [],
            'actions': [],
            'terminals': [],
        };
        if (batchSize > this.length){
            console.warn("The size of the replay buffer is < to the batchSize. Return empty batch.");
            return batch;
        }

        if (this.buffer.length > 0){
            //console.log("Get half of prior and other from buffer.");
            batchSize = batchSize / 2;
        }
        else{
            //console.log("Get all from priorBuffer");
        }

        for (let b=0; b < batchSize; b++){
            let id = Math.floor(Math.random() * this.priorBuffer.length);
            batch.obs0.push(this.priorBuffer[id].obs0);
            batch.obs1.push(this.priorBuffer[id].obs1);
            batch.rewards.push(this.priorBuffer[id].reward);
            batch.actions.push(this.priorBuffer[id].action);
            batch.terminals.push(this.priorBuffer[id].terminal);
            this.priorBuffer.splice(id, 1);
        }

        if (this.buffer.length > 0){
            this._addRandomBufferBatch(batchSize, batch);
        }
        console.assert(batch.obs0.length == originalBatchSize);
        return batch
    }

    _insert(element, array) {
        if (array.length == 0 || element.cost < array[0].cost || array[0].cost == null){
            array.unshift(element);
            return array;
        }
        array.splice(this._locationOf(element, array) + 1, 0, element);
        return array;
    }
    
    _locationOf(element, array, start, end) {
        start = start || 0;
        end = end || array.length;
    
        var pivot = parseInt(start + (end - start) / 2, 10);
    
        if (end-start <= 1 || array[pivot] === element) return pivot;
    
        if (array[pivot].cost != null && array[pivot].cost < element.cost) {
            return this._locationOf(element, array, pivot, end);
        } else {
            return this._locationOf(element, array, start, pivot);
        }
    }

    /**
     * @param batch (Object)  from getBatch() 
     * @param cost (number) Cost associated with each row of the batch
     */
    appendBackWithCost(batch, costs){
        for (let b=0; b < batch.obs0.length; b++){
            if (this.buffer.length == this.maxlen){
                this.buffer.shift();
            }
            this._insert({
                obs0: batch.obs0[b],
                action: batch.actions[b],
                reward: batch.rewards[b],
                obs1: batch.obs1[b],
                terminal: batch.terminals[b],
                cost: costs[b]
            }, this.buffer);
        }
        console.assert(this.buffer.length <= this.maxlen);
    }

    /**
     * @param obs0 []
     * @param action (number)
     * @param reward (number)
     * @param obs1 []
     * @param terminal1 (boolean)
     */
    append(obs0, action, reward, obs1, terminal){
        if (this.priorBuffer.length == this.maxlen){
            this.priorBuffer.shift();
        }
        this.priorBuffer.push({
            obs0: obs0,
            action: action,
            reward: reward,
            obs1: obs1,
            terminal: terminal,
            cost: null
        });
        console.assert(this.priorBuffer.length <= this.maxlen);
    }
}
/*
var mem = new Memory(20000);
Math.seedrandom(0);
console.assert(mem.length == 0);

var array = [];
for (let i=1; i < 40000; i++){
    mem.append("obs0-"+i, "action-"+i, "reward-"+i, "obs1-"+i, "terminal-"+i);
}

console.assert(mem.length == 20000);
console.assert(mem.list[0].obs0 == "obs0-20000");
console.assert(mem.list[19999].obs0 == "obs0-39999");

let batch = mem.getBatch(32);

console.assert(batch.obs0.length == 32);
console.assert(mem.length == 20000 - 32);

let costs = [];
for (i=31; i >= 0; i--){
    costs.push(i);
}
mem.appendBackWithCost(batch, costs);

console.log(mem.list);

/*
for (let i=1; i < 64; i++){
    mem.append("obs0-"+i, "action-"+i, "reward-"+i, "obs1-"+i, "terminal-"+i);
}
*/