import SwiftUI
import HealthKit

struct ContentView: View {
    @StateObject private var healthKitManager = HealthKitManager()
    @State private var isAuthorized = false
    @State private var heartRateData: [HeartRateSample] = []
    @State private var isSyncing = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Header
                VStack {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 50))
                        .foregroundColor(.red)
                    
                    Text("Basketball Performance")
                        .font(.title)
                        .fontWeight(.bold)
                    
                    Text("HealthKit Integration")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding()
                
                // Authorization Status
                VStack {
                    if isAuthorized {
                        Label("HealthKit Authorized", systemImage: "checkmark.circle.fill")
                            .foregroundColor(.green)
                    } else {
                        Label("HealthKit Not Authorized", systemImage: "xmark.circle.fill")
                            .foregroundColor(.red)
                    }
                }
                .padding()
                
                // Heart Rate Data
                if !heartRateData.isEmpty {
                    VStack(alignment: .leading) {
                        Text("Recent Heart Rate Data")
                            .font(.headline)
                        
                        ScrollView {
                            LazyVStack {
                                ForEach(heartRateData.prefix(10), id: \.timestamp) { sample in
                                    HStack {
                                        VStack(alignment: .leading) {
                                            Text("\(Int(sample.heartRate)) BPM")
                                                .font(.title2)
                                                .fontWeight(.semibold)
                                            
                                            Text(sample.timestamp, style: .time)
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                        }
                                        
                                        Spacer()
                                        
                                        Image(systemName: "heart.fill")
                                            .foregroundColor(.red)
                                    }
                                    .padding()
                                    .background(Color(.systemGray6))
                                    .cornerRadius(10)
                                }
                            }
                        }
                        .frame(maxHeight: 300)
                    }
                    .padding()
                }
                
                // Sync Button
                Button(action: {
                    Task {
                        await syncHealthKitData()
                    }
                }) {
                    HStack {
                        if isSyncing {
                            ProgressView()
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: "arrow.clockwise")
                        }
                        Text(isSyncing ? "Syncing..." : "Sync HealthKit Data")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
                .disabled(!isAuthorized || isSyncing)
                .padding()
                
                Spacer()
            }
            .navigationTitle("HealthKit Sync")
            .onAppear {
                checkAuthorization()
            }
        }
    }
    
    private func checkAuthorization() {
        isAuthorized = healthKitManager.isAuthorized
    }
    
    private func syncHealthKitData() async {
        isSyncing = true
        
        do {
            let samples = try await healthKitManager.fetchRecentHeartRateData()
            heartRateData = samples
            
            // Send to backend
            await sendDataToBackend(samples)
            
        } catch {
            print("Error syncing HealthKit data: \(error)")
        }
        
        isSyncing = false
    }
    
    private func sendDataToBackend(_ samples: [HeartRateSample]) async {
        // TODO: Implement backend API call
        print("Sending \(samples.count) heart rate samples to backend")
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
