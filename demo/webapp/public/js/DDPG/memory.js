
class Memory {

    /**
     * @param maxlen (number) Buffer limit
     */
    constructor(maxlen){
        this.maxlen = maxlen;
        this.length = 0;
        this.start = 0;

        this.obs0List = Array.apply(null, Array(maxlen)).map(Number.prototype.valueOf, 0);
        this.obs1List = Array.apply(null, Array(maxlen)).map(Number.prototype.valueOf, 0);
        this.rewardsList = Array.apply(null, Array(maxlen)).map(Number.prototype.valueOf, 0);
        this.actionsList = Array.apply(null, Array(maxlen)).map(Number.prototype.valueOf, 0);
        this.terminals1List = Array.apply(null, Array(maxlen)).map(Number.prototype.valueOf, 0);
    }

    /**
     * @param idx (number)
     */
    getItem(idx){
        if (idx < 0 || idx >= this.length){
            console.error("Memory.getItem: idx not in range.");
        }
        return this.data[(this.start + idx) % this.maxlen]
    }

    /**
     * Sample a batch
     * @param batchSize (number)
     * @return batch []
     */
    getBatch(batchSize){
        const arrLength = this.obs0List.length;
        const batch =  {
            'obs0': [],
            'obs1': [],
            'rewards': [],
            'actions': [],
            'terminals1': [],
        };
        for (let b=0; b < batchSize; b++){
            let id = Math.floor(Math.random() * arrLength);
            batch.obs0.push(this.obs0List[id]);
            batch.obs1.push(this.obs1List[id]);
            batch.rewards.push(this.rewardsList[id]);
            batch.actions.push(this.actionsList[id]);
            batch.terminals1.push(this.terminals1List[id]);
        }
        return batch
    }

    /**
     * @param obs0 []
     * @param action (number)
     * @param reward (number)
     * @param obs1 []
     * @param terminal1 (boolean)
     */
    append(obs0, action, reward, obs1, terminal1){
        if (this.length < this.maxlen){
            this.length += 1;
        }
        else if (this.length == this.maxlen) {
            this.start = (this.start + 1) % this.maxlen;
        }
        else {
            console.error("Memory.append: This should never be printed");
        }
        this.obs0List[(this.start + this.length - 1) % this.maxlen] = obs0;
        this.obs1List[(this.start + this.length - 1) % this.maxlen] = action;
        this.rewardsList[(this.start + this.length - 1) % this.maxlen] = reward;
        this.actionsList[(this.start + this.length - 1) % this.maxlen] = obs1;
        this.terminals1List[(this.start + this.length - 1) % this.maxlen] = terminal1;
    }
}