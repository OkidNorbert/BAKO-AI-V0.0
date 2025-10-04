import Foundation
import HealthKit

class HealthKitManager: ObservableObject {
    private let healthStore = HKHealthStore()
    @Published var isAuthorized = false
    
    init() {
        checkAuthorization()
    }
    
    func checkAuthorization() {
        guard HKHealthStore.isHealthDataAvailable() else {
            print("HealthKit is not available on this device")
            return
        }
        
        let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        let status = healthStore.authorizationStatus(for: heartRateType)
        isAuthorized = status == .sharingAuthorized
    }
    
    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else {
            throw HealthKitError.notAvailable
        }
        
        let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        let activeEnergyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!
        let stepCountType = HKQuantityType.quantityType(forIdentifier: .stepCount)!
        
        let typesToRead: Set<HKObjectType> = [heartRateType, activeEnergyType, stepCountType]
        
        try await healthStore.requestAuthorization(toShare: nil, read: typesToRead)
        
        DispatchQueue.main.async {
            self.checkAuthorization()
        }
    }
    
    func fetchRecentHeartRateData() async throws -> [HeartRateSample] {
        guard isAuthorized else {
            throw HealthKitError.notAuthorized
        }
        
        let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        let predicate = HKQuery.predicateForSamples(
            withStart: Calendar.current.date(byAdding: .hour, value: -24, to: Date()),
            end: Date(),
            options: .strictEndDate
        )
        
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: heartRateType,
                predicate: predicate,
                limit: 100,
                sortDescriptors: [sortDescriptor]
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                
                let heartRateSamples = samples?.compactMap { sample in
                    guard let quantitySample = sample as? HKQuantitySample else { return nil }
                    let heartRate = quantitySample.quantity.doubleValue(for: HKUnit(from: "count/min"))
                    return HeartRateSample(
                        heartRate: heartRate,
                        timestamp: sample.startDate
                    )
                } ?? []
                
                continuation.resume(returning: heartRateSamples)
            }
            
            healthStore.execute(query)
        }
    }
    
    func fetchActiveEnergyData() async throws -> [ActiveEnergySample] {
        guard isAuthorized else {
            throw HealthKitError.notAuthorized
        }
        
        let activeEnergyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!
        let predicate = HKQuery.predicateForSamples(
            withStart: Calendar.current.date(byAdding: .hour, value: -24, to: Date()),
            end: Date(),
            options: .strictEndDate
        )
        
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: activeEnergyType,
                predicate: predicate,
                limit: 100,
                sortDescriptors: nil
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                
                let energySamples = samples?.compactMap { sample in
                    guard let quantitySample = sample as? HKQuantitySample else { return nil }
                    let energy = quantitySample.quantity.doubleValue(for: HKUnit.kilocalorie())
                    return ActiveEnergySample(
                        energy: energy,
                        timestamp: sample.startDate
                    )
                } ?? []
                
                continuation.resume(returning: energySamples)
            }
            
            healthStore.execute(query)
        }
    }
}

// MARK: - Data Models

struct HeartRateSample {
    let heartRate: Double
    let timestamp: Date
}

struct ActiveEnergySample {
    let energy: Double
    let timestamp: Date
}

// MARK: - Errors

enum HealthKitError: Error {
    case notAvailable
    case notAuthorized
    case dataNotAvailable
}
