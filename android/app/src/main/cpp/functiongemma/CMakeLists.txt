cmake_minimum_required(VERSION 3.22.1)
project(functiongemma_jni)
# The app's Debug variant is installed on the physical Zenfone, but inference
# must not run at compiler O0: it turns a small CPU model into a false timeout.
set(CMAKE_C_FLAGS_DEBUG "-O3 -g" CACHE STRING "" FORCE)
set(CMAKE_CXX_FLAGS_DEBUG "-O3 -g" CACHE STRING "" FORCE)
set(LLAMA_SRC ${CMAKE_CURRENT_LIST_DIR}/../../../../../third_party/llama.cpp)
set(BUILD_SHARED_LIBS ON CACHE BOOL "" FORCE)
set(GGML_NATIVE OFF CACHE BOOL "" FORCE)
# The APK ships exactly two CPU modules: armv8.0 fallback and armv8.2+dotprod.
# nativeInit loads them from applicationInfo.nativeLibraryDir and llama.cpp
# selects the highest scoring module supported by the current device.
set(GGML_BACKEND_DL ON CACHE BOOL "" FORCE)
set(GGML_CPU ON CACHE BOOL "" FORCE)
set(GGML_CPU_ALL_VARIANTS OFF CACHE BOOL "" FORCE)
set(GGML_OPENMP OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_SERVER OFF CACHE BOOL "" FORCE)
add_subdirectory(${LLAMA_SRC} ${CMAKE_BINARY_DIR}/llama)
add_library(functiongemma_jni SHARED functiongemma_jni.cpp)
target_include_directories(functiongemma_jni PRIVATE ${LLAMA_SRC}/include ${LLAMA_SRC}/ggml/include)
target_link_libraries(functiongemma_jni llama ggml android log)
