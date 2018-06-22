/**
 * Noise class
 * The original baseline is made of three noise
 * AdaptiveParamNoiseSpec, ActionNoise and NormalActionNoise
 * Only AdaptiveParamNoiseSpec is implemented for now
 * See "C Adapative Scaling" Page 14 in the paper.
 */

class AdaptiveParamNoiseSpec {

    /**
     * @param conf Object
     *      conf.initialStddev: 0.1 default // σ
     *      conf.desiredActionStddev: 0.1 default // δ
     *      conf.adoptionCoefficient: 1.01 default // α
     */
    constructor(conf){
        conf = conf || {};
        this.initialStddev = conf.initialStddev || 0.1;
        this.desiredActionStddev = conf.initialStddev || 0.1;
        this.adoptionCoefficient = conf.adoptionCoefficient || 1.01;
        this.currentStddev = this.initialStddev;
    }

    /**
     * The distance from the Adaptive scaling
     * @param distance number
     */
    adapt(distance){
        // if d(π, _π_) > δ then σ = σ/α
        if (distance > this.desiredActionStddev){
            // Decrease σ
            this.currentStddev /= this.adoptionCoefficient;
        }
        else{
            // σ = σ*α
            // Increase σ
            this.currentStddev *= this.adoptionCoefficient;
        }
    }
};