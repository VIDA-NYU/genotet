import numpy as np
import random
import string
f = open('bed_output.txt', 'w')
start_all = 2999997
end_all = 3001000

offset = 2999997
gap = random.randint(10, 50)
length = random.randint(1, 10)
offset += gap
while offset <= end_all:
	start = offset
	end = offset + length
	name = ''.join(random.choice(string.lowercase) for i in range(10))
	output = str(start) + '\t' + str(end) + '\t' + str(name) + '\n'
	f.write(output)

	gap = random.randint(10, 50)
	length = random.randint(1, 10)
	offset += length