import numpy as np
f = open('binding_output.txt', 'w')
f.write('#bedGraph section chr1:2999997-3001000\n')
offset = 2999997
chr1 = 'chr1\t'
for i in xrange(1000):
	start = offset
	end = offset + 1
	if i == 999:
		end = 3001000
	offset += 1
	value = np.random.rand(1)[0]
	output = chr1 + str(start) + '\t' + str(end) + '\t' + str(value) + '\n'
	f.write(output)

f.write('#bedGraph section chr2:3001050-3002100\n')
offset = 3001050
chr2 = 'chr2\t'
for i in xrange(1000):
	start = offset
	end = offset + 1
	if i == 999:
		end = 3002100
	offset += 1
	value = np.random.rand(1)[0]
	output = chr2 + str(start) + '\t' + str(end) + '\t' + str(value) + '\n'
	f.write(output)

