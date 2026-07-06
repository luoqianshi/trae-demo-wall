def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr


def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)


if __name__ == "__main__":
    test_arr = [64, 34, 25, 12, 22, 11, 90]
    print("排序前:", test_arr)
    print("排序后:", bubble_sort(test_arr))
    print("斐波那契前10项:", [fibonacci(i) for i in range(10)])
