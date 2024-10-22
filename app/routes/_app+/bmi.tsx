import { useState } from "react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import PageHeading from "~/components/page-heading";

export default function BMI() {
  const [height, setHeight] = useState("170");
  const [weight, setWeight] = useState("70");
  const [bmi, setBmi] = useState<number | null>(null);

  const calculateBMI = () => {
    const heightValue = Number.parseFloat(height);
    const weightValue = Number.parseFloat(weight);
    if (
      Number.isNaN(heightValue) ||
      Number.isNaN(weightValue) ||
      heightValue <= 0 ||
      weightValue <= 0
    ) {
      alert("Please enter valid height and weight values.");
      return;
    }
    const heightInMeters = heightValue / 100;
    const calculatedBMI = weightValue / (heightInMeters * heightInMeters);
    setBmi(Number.parseFloat(calculatedBMI.toFixed(1)));
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) {
      return { category: "Underweight", color: "text-blue-500" };
    }
    if (bmi < 25) {
      return { category: "Normal weight", color: "text-green-500" };
    }
    if (bmi < 30) {
      return { category: "Overweight", color: "text-yellow-500" };
    }
    return { category: "Obese", color: "text-red-500" };
  };

  return (
    <div>
      <PageHeading>BMI Calculator</PageHeading>
      <div className="mx-auto p-4 min-h-screen bg-white">
        <div className="space-y-8">
          <div className="text-gray-600">
            <h2 className="text-2xl font-semibold mb-2 text-green-600">What is BMI?</h2>
            <p className="mb-4">
              Body Mass Index (BMI) is a measure of body fat based on height and weight. It is a
              useful indicator of overall health and risk for various diseases.
            </p>

            <h3 className="text-xl font-semibold mb-2 text-green-600">BMI Categories:</h3>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>
                <strong>Underweight:</strong> Less than 18.5
              </li>
              <li>
                <strong>Normal weight:</strong> 18.5 – 24.9
              </li>
              <li>
                <strong>Overweight:</strong> 25 – 29.9
              </li>
              <li>
                <strong>Obesity:</strong> 30 or greater
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 text-green-600">Why is BMI important?</h3>
            <p>
              The higher your BMI, the higher your risk for certain diseases such as heart disease,
              high blood pressure, type 2 diabetes, gallstones, breathing problems, and certain
              cancers.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-green-600">Calculate Your BMI</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="height" className="text-sm font-medium text-gray-700">
                  Height (cm)
                </Label>
                <Input
                  id="height"
                  type="text"
                  inputMode="decimal"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
                  Weight (kg)
                </Label>
                <Input
                  id="weight"
                  type="text"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <Button
              onClick={calculateBMI}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3"
            >
              Calculate BMI
            </Button>
            {bmi !== null && (
              <div className="mt-6 text-center p-4 bg-green-100 rounded-lg">
                <p className="text-4xl font-bold text-green-800">Your BMI is: {bmi}</p>
                <p className={`text-xl mt-2 ${getBMICategory(bmi).color}`}>
                  {getBMICategory(bmi).category}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
