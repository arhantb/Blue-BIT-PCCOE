
import numpy as np

class KalmanFilter1D:
    def __init__(self, initial_state=0, initial_estimate_error=1, process_variance=0.1, measurement_variance=0.5):
        self.state = initial_state
        self.estimate_error = initial_estimate_error
        self.process_variance = process_variance
        self.measurement_variance = measurement_variance

    def update(self, measurement):
        # Prediction update
        # state is expected to stay the same between measurements for queue sensing
        
        # Measurement update
        kalman_gain = self.estimate_error / (self.estimate_error + self.measurement_variance)
        self.state = self.state + kalman_gain * (measurement - self.state)
        self.estimate_error = (1 - kalman_gain) * self.estimate_error + self.process_variance
        
        return self.state

# Vehicle Weights for Density-Based Priority
WEIGHTS = {
    'TRUCK': 3.0,
    'CAR': 1.0,
    'BIKE': 0.3
}

def calculate_optimal_green_split(queues, total_cycle_length=60, yellow_time=3):
    """
    queues: dict with 'NS' and 'WE' weighted demand (Sum of Vehicle Weights)
    Returns: green_splits (dict)
    """
    available_green = total_cycle_length - (2 * yellow_time)
    
    # Sum of demands
    ns_demand = queues.get('NS', 1)
    we_demand = queues.get('WE', 1)
    
    denominator = ns_demand + we_demand
    if denominator == 0:
        return {'NS': available_green / 2, 'WE': available_green / 2}
    
    # Webster's method inspired split proportioning
    ns_split = (ns_demand / denominator) * available_green
    we_split = (we_demand / denominator) * available_green
    
    # Enforce minimum green time (e.g., 10 seconds)
    min_green = 10
    if ns_split < min_green:
        ns_split = min_green
        we_split = available_green - min_green
    elif we_split < min_green:
        we_split = min_green
        ns_split = available_green - min_green
        
    return {
        'NS': round(ns_split),
        'WE': round(we_split)
    }

def compute_coordination_offset(distance_m, avg_speed_kmph=35):
    """
    Calculates signal offset for Green Wave synchronization.
    """
    speed_m_s = avg_speed_kmph / 3.6
    travel_time_s = distance_m / speed_m_s
    return round(travel_time_s)

# Example Usage
if __name__ == "__main__":
    # Test Kalman
    kf = KalmanFilter1D()
    measurements = [5, 6, 4, 10, 12, 11]
    print("Kalman Filtering Test:")
    for m in measurements:
        print(f"Raw: {m}, Filtered: {kf.update(m):.2f}")
        
    # Test Split Optimization
    queues = {'NS': 45, 'WE': 90} # Heavy WE traffic
    splits = calculate_optimal_green_split(queues)
    print(f"\nOptimal splits for WE surge: {splits}")
