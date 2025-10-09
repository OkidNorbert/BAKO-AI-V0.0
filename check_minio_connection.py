import os
from datetime import timedelta
from minio import Minio
from minio.error import S3Error

print("--- MinIO Connection Diagnostic Script ---")

# Get environment variables
MINIO_ENDPOINT = os.environ.get('MINIO_ENDPOINT')
MINIO_ACCESS_KEY = os.environ.get('MINIO_ACCESS_KEY')
MINIO_SECRET_KEY = os.environ.get('MINIO_SECRET_KEY')
MINIO_BUCKET = os.environ.get('MINIO_BUCKET')

print(f"Env - Endpoint: {MINIO_ENDPOINT}")
print(f"Env - Access Key: {MINIO_ACCESS_KEY}")
print(f"Env - Secret Key: {'*' * len(MINIO_SECRET_KEY)}") # Mask sensitive info
print(f"Env - Bucket: {MINIO_BUCKET}")

if not all([MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET]):
    print("ERROR: One or more MinIO environment variables are missing!")
    exit(1)

try:
    # Initialize MinIO client
    client = Minio(
        MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=False
    )
    print("MinIO Client initialized successfully.")

    # Check if bucket exists
    if client.bucket_exists(MINIO_BUCKET):
        print(f"SUCCESS: Bucket '{MINIO_BUCKET}' exists.")
    else:
        print(f"WARNING: Bucket '{MINIO_BUCKET}' does NOT exist.")
        print("Attempting to list all buckets to diagnose...")
        # List all buckets to see what the client perceives
        buckets = client.list_buckets()
        if buckets:
            print("Existing buckets:")
            for b in buckets:
                print(f"  - {b.name}")
        else:
            print("No buckets found by client.list_buckets().")

        print("Attempting to make bucket again...")
        client.make_bucket(MINIO_BUCKET)
        print(f"Bucket '{MINIO_BUCKET}' made successfully by client.")
        if client.bucket_exists(MINIO_BUCKET):
            print(f"Bucket '{MINIO_BUCKET}' now exists after re-creation attempt.")
        else:
            print(f"ERROR: Bucket '{MINIO_BUCKET}' still does NOT exist after re-creation attempt.")
            exit(1)

    # Generate a presigned upload URL
    test_object_name = "temp-test-upload.txt"
    presigned_url = client.presigned_put_object(
        MINIO_BUCKET,
        test_object_name,
        expires=timedelta(minutes=10) # Using timedelta here
    )
    print(f"SUCCESS: Presigned URL generated for '{test_object_name}'.")
    print(f"Presigned URL (first 100 chars): {presigned_url[:100]}...")

except S3Error as e:
    print(f"MinIO S3Error: code={e.code}, message={e.message}")
    print(f"Resource={e.resource}, Request ID={e.request_id}, Host ID={e.host_id}")
    print(f"Bucket Name={e.bucket_name}")
    exit(1)
except Exception as e:
    print(f"ERROR: An unexpected error occurred: {repr(e)}")
    import traceback
    traceback.print_exc()
    exit(1)

print("--- MinIO Connection Diagnostic Complete ---")
